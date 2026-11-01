package com.sms.pricing;

import static org.assertj.core.api.Assertions.assertThat;

import com.sms.pricing.dto.BundleCalculationRequest;
import com.sms.pricing.dto.BundleCalculationResponse;
import com.sms.pricing.dto.BundleItemDto;
import com.sms.pricing.dto.CalculatedTermItem;
import com.sms.pricing.dto.PriceCalculationRequest;
import com.sms.pricing.dto.PriceCalculationResponse;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class PriceCalculationServiceTest {

    private PriceCalculationService service;

    @BeforeEach
    void setUp() {
        service = new PriceCalculationService(null, null, null, null);
    }

    @Test
    @DisplayName("Should determine suggested down payment according to bracket thresholds")
    void shouldDetermineSuggestedDownPayment() {
        // HD < 5.000.000 -> 0
        assertThat(service.getSuggestedDp(BigDecimal.valueOf(4_999_000)))
                .isEqualByComparingTo(BigDecimal.ZERO);

        // 5.000.000 <= HD < 6.000.000 -> 1.000.000
        assertThat(service.getSuggestedDp(BigDecimal.valueOf(5_500_000)))
                .isEqualByComparingTo(BigDecimal.valueOf(1_000_000));

        // 6.000.000 <= HD < 7.000.000 -> 1.500.000
        assertThat(service.getSuggestedDp(BigDecimal.valueOf(6_200_000)))
                .isEqualByComparingTo(BigDecimal.valueOf(1_500_000));

        // 7.000.000 <= HD < 8.000.000 -> 2.000.000
        assertThat(service.getSuggestedDp(BigDecimal.valueOf(7_900_000)))
                .isEqualByComparingTo(BigDecimal.valueOf(2_000_000));

        // HD >= 8.000.000 -> 2.500.000
        assertThat(service.getSuggestedDp(BigDecimal.valueOf(9_000_000)))
                .isEqualByComparingTo(BigDecimal.valueOf(2_500_000));
    }

    @Test
    @DisplayName("Should accurately calculate installment using verified VBA formula with 0 DP")
    void shouldCalculateInstallmentFormulaZeroDp() {
        // HD = 2.878.000, DP = 0, Tenor = 10 months
        CalculatedTermItem result = service.calculateInstallment(
                BigDecimal.valueOf(2_878_000),
                BigDecimal.ZERO,
                10
        );

        // Formula:
        // h1 = (2878 - 0) + 30 = 2908
        // h2 = 2908 * (1 + 0.04 * 10) = 4071.2
        // h3 = 4071.2 / 10 = 407.12
        // h4 = 407.12 * 0.85 = 346.052
        // angsuranK = Round(346.052 / 5) * 5 + 5 = 69 * 5 + 5 = 350
        // Angsuran = Rp 350.000
        assertThat(result.termMonths()).isEqualTo(10);
        assertThat(result.monthlyInstallment()).isEqualByComparingTo(BigDecimal.valueOf(350_000));
        assertThat(result.totalPrice()).isEqualByComparingTo(BigDecimal.valueOf(3_500_000));
    }

    @Test
    @DisplayName("Should accurately calculate custom negotiated buyer DP (e.g. 10% DP)")
    void shouldCalculateCustomNegotiatedDp() {
        // HD = 4.500.000, Custom DP = 450.000 (10%), Tenor = 10 months
        CalculatedTermItem result = service.calculateInstallment(
                BigDecimal.valueOf(4_500_000),
                BigDecimal.valueOf(450_000),
                10
        );

        // Formula:
        // h1 = (4500 - 450) + 30 = 4080
        // h2 = 4080 * 1.4 = 5712
        // h3 = 5712 / 10 = 571.2
        // h4 = 571.2 * 0.85 = 485.52
        // angsuranK = Round(485.52 / 5) * 5 + 5 = 97 * 5 + 5 = 490
        // Angsuran = Rp 490.000
        assertThat(result.termMonths()).isEqualTo(10);
        assertThat(result.monthlyInstallment()).isEqualByComparingTo(BigDecimal.valueOf(490_000));
        assertThat(result.totalPrice()).isEqualByComparingTo(BigDecimal.valueOf(4_900_000));
    }

    @Test
    @DisplayName("Should calculate across multi-tenors in calculation request")
    void shouldCalculateMultiTenors() {
        PriceCalculationRequest req = new PriceCalculationRequest(
                BigDecimal.valueOf(4_500_000),
                BigDecimal.valueOf(450_000),
                List.of(6, 10, 12, 15)
        );

        PriceCalculationResponse response = service.calculate(req);

        assertThat(response.hargaDasar()).isEqualByComparingTo(BigDecimal.valueOf(4_500_000));
        assertThat(response.downPayment()).isEqualByComparingTo(BigDecimal.valueOf(450_000));
        assertThat(response.autoDpApplied()).isFalse();
        assertThat(response.terms()).hasSize(4);
        assertThat(response.terms().get(1).termMonths()).isEqualTo(10);
        assertThat(response.terms().get(1).monthlyInstallment()).isEqualByComparingTo(BigDecimal.valueOf(490_000));
    }

    @Test
    @DisplayName("G.15: Should combine electronics (TV) and furniture (Sofa) into blended bundle with aggregated DP and shared installment schedule")
    void shouldCalculateMultiProductCreditBundle() {
        // Product 1: Smart TV 55" (Electronics) HD = 5.000.000
        // Product 2: Sofa Bed L-Shape (Furniture) HD = 3.500.000
        List<BundleItemDto> items = List.of(
                new BundleItemDto(null, "Smart TV 55 Inch", "Electronics", 1, BigDecimal.valueOf(5_000_000), BigDecimal.valueOf(5_500_000)),
                new BundleItemDto(null, "Sofa Bed L-Shape", "Furniture", 1, BigDecimal.valueOf(3_500_000), BigDecimal.valueOf(4_000_000))
        );

        // Combined Total HD = 8.500.000. Auto DP for 8.5M bracket (HD >= 8M) is 2.500.000
        BundleCalculationRequest request = new BundleCalculationRequest(
                items,
                null,
                null,
                null, // auto DP
                List.of(6, 10, 12, 15, 18, 24)
        );

        BundleCalculationResponse response = service.calculateBundle(request);

        assertThat(response.totalHargaDasar()).isEqualByComparingTo(BigDecimal.valueOf(8_500_000));
        assertThat(response.bundleDiscount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.netHargaDasar()).isEqualByComparingTo(BigDecimal.valueOf(8_500_000));
        assertThat(response.downPayment()).isEqualByComparingTo(BigDecimal.valueOf(2_500_000));
        assertThat(response.autoDpApplied()).isTrue();
        assertThat(response.terms()).hasSize(6);

        // Term 10:
        // Net HD = 8.500.000, DP = 2.500.000
        // h1 = (8500 - 2500) + 30 = 6030
        // h2 = 6030 * 1.4 = 8442
        // h3 = 8442 / 10 = 844.2
        // h4 = 844.2 * 0.85 = 717.57
        // angsuranK = Round(717.57 / 5) * 5 + 5 = 144 * 5 + 5 = 725 -> Rp 725.000
        CalculatedTermItem term10 = response.terms().stream()
                .filter(t -> t.termMonths() == 10)
                .findFirst().orElseThrow();
        assertThat(term10.monthlyInstallment()).isEqualByComparingTo(BigDecimal.valueOf(725_000));

        // Standalone comparison:
        // Separate TV (HD=5M, auto DP=1M) -> h1 = (5000-1000)+30 = 4030 -> h2=5642 -> h3=564.2 -> h4=479.57 -> angsuran=485.000
        // Separate Sofa (HD=3.5M, auto DP=0) -> h1 = 3530 -> h2=4942 -> h3=494.2 -> h4=420.07 -> angsuran=425.000
        // Separate total = 485.000 + 425.000 = 910.000
        // Monthly bundle savings = 910.000 - 725.000 = 185.000 / month!
        BigDecimal sep10 = response.separateTotalInstallments().get(10);
        assertThat(sep10).isEqualByComparingTo(BigDecimal.valueOf(910_000));
        BigDecimal saving10 = response.monthlySavings().get(10);
        assertThat(saving10).isEqualByComparingTo(BigDecimal.valueOf(185_000));
    }

    @Test
    @DisplayName("G.15: Should apply promotional percentage bundle discount")
    void shouldApplyPromotionalBundleDiscount() {
        List<BundleItemDto> items = List.of(
                new BundleItemDto(null, "Smart TV", "Electronics", 1, BigDecimal.valueOf(5_000_000), BigDecimal.valueOf(5_000_000)),
                new BundleItemDto(null, "Soundbar", "Electronics", 1, BigDecimal.valueOf(1_000_000), BigDecimal.valueOf(1_000_000))
        );

        // 10% promotional bundle discount on 6.000.000 = 600.000 discount -> Net HD = 5.400.000
        BundleCalculationRequest request = new BundleCalculationRequest(
                items,
                BigDecimal.valueOf(10), // 10%
                null,
                BigDecimal.valueOf(1_000_000), // custom DP
                List.of(10)
        );

        BundleCalculationResponse response = service.calculateBundle(request);

        assertThat(response.totalHargaDasar()).isEqualByComparingTo(BigDecimal.valueOf(6_000_000));
        assertThat(response.bundleDiscount()).isEqualByComparingTo(BigDecimal.valueOf(600_000));
        assertThat(response.netHargaDasar()).isEqualByComparingTo(BigDecimal.valueOf(5_400_000));
        assertThat(response.downPayment()).isEqualByComparingTo(BigDecimal.valueOf(1_000_000));
        assertThat(response.autoDpApplied()).isFalse();
        assertThat(response.terms()).hasSize(1);
    }
}
