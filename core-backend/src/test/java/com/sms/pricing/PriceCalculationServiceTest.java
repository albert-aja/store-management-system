package com.sms.pricing;

import static org.assertj.core.api.Assertions.assertThat;

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
}
