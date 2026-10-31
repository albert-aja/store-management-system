package com.sms.pricing;

import com.sms.common.web.NotFoundException;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import com.sms.pricing.dto.AutoApplyPricingRequest;
import com.sms.pricing.dto.CalculatedTermItem;
import com.sms.pricing.dto.PriceCalculationRequest;
import com.sms.pricing.dto.PriceCalculationResponse;
import com.sms.product.dto.ProductVariant;
import com.sms.product.repository.ProductVariantRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PriceCalculationService {

    private final StoreProductPriceRepository priceRepository;
    private final StoreProductPaymentPlanRepository planRepository;
    private final StoreRepository storeRepository;
    private final ProductVariantRepository variantRepository;

    private static final List<Integer> DEFAULT_TERMS = List.of(10, 12, 15);

    /**
     * Calculates the suggested Down Payment (DP) based on Harga Dasar (HD) brackets.
     * Bracket rules:
     * - HD < 5.000.000 : DP = 0
     * - 5.000.000 <= HD < 6.000.000 : DP = 1.000.000
     * - 6.000.000 <= HD < 7.000.000 : DP = 1.500.000
     * - 7.000.000 <= HD < 8.000.000 : DP = 2.000.000
     * - HD >= 8.000.000 : DP = 2.500.000
     */
    public BigDecimal getSuggestedDp(BigDecimal hargaDasar) {
        if (hargaDasar == null || hargaDasar.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal hdK = toThousands(hargaDasar);
        if (hdK.compareTo(BigDecimal.valueOf(5000)) < 0) {
            return BigDecimal.ZERO;
        } else if (hdK.compareTo(BigDecimal.valueOf(6000)) < 0) {
            return BigDecimal.valueOf(1_000_000);
        } else if (hdK.compareTo(BigDecimal.valueOf(7000)) < 0) {
            return BigDecimal.valueOf(1_500_000);
        } else if (hdK.compareTo(BigDecimal.valueOf(8000)) < 0) {
            return BigDecimal.valueOf(2_000_000);
        } else {
            return BigDecimal.valueOf(2_500_000);
        }
    }

    /**
     * Exact retail price formula verified from standard VBA implementation:
     * h1 = (hd - dp) + 30
     * h2 = h1 + (h1 * 0.04 * term)
     * h3 = h2 / term
     * h4 = h3 - (h3 * 0.15)
     * ANGSURAN = Round(h4 / 5, 0) * 5 + 5
     */
    public CalculatedTermItem calculateInstallment(BigDecimal hargaDasar, BigDecimal downPayment, int termMonths) {
        if (hargaDasar == null || hargaDasar.compareTo(BigDecimal.ZERO) <= 0 || termMonths <= 0) {
            return new CalculatedTermItem(termMonths, BigDecimal.ZERO, BigDecimal.ZERO);
        }

        double hdK = toThousands(hargaDasar).doubleValue();
        double dpK = downPayment != null ? toThousands(downPayment).doubleValue() : 0.0;

        // Step 1: Net Financed Base + Flat Rp 30.000 fee
        double h1 = (hdK - dpK) + 30.0;

        // Step 2: 4% Flat interest per month
        double markupRate = 0.04 * termMonths;
        double h2 = h1 + (h1 * markupRate);

        // Step 3: Gross monthly payment
        double h3 = h2 / termMonths;

        // Step 4: 15% prompt / commercial incentive discount
        double h4 = h3 - (h3 * 0.15);

        // Step 5: Rounding to 5k and add 5k
        long angsuranK = Math.round(h4 / 5.0) * 5 + 5;

        // Convert back to Rupiah
        BigDecimal monthlyInstallment = BigDecimal.valueOf(angsuranK).multiply(BigDecimal.valueOf(1000));
        BigDecimal totalPrice = monthlyInstallment.multiply(BigDecimal.valueOf(termMonths));

        return new CalculatedTermItem(termMonths, monthlyInstallment, totalPrice);
    }

    /**
     * Calculates installments for multiple tenors.
     */
    public PriceCalculationResponse calculate(PriceCalculationRequest request) {
        BigDecimal hd = request.hargaDasar() != null ? request.hargaDasar() : BigDecimal.ZERO;
        boolean autoDp = request.downPayment() == null;
        BigDecimal dp = autoDp ? getSuggestedDp(hd) : request.downPayment();

        List<Integer> terms = (request.termMonths() != null && !request.termMonths().isEmpty())
                ? request.termMonths()
                : DEFAULT_TERMS;

        List<CalculatedTermItem> items = new ArrayList<>();
        for (int term : terms) {
            items.add(calculateInstallment(hd, dp, term));
        }

        return new PriceCalculationResponse(hd, dp, autoDp, items);
    }

    /**
     * Auto-applies the formula to a store product price and creates/updates payment plans.
     */
    @Transactional
    public StoreProductPrice autoApplyPricing(AutoApplyPricingRequest request) {
        UUID storeId = request.storeId();
        UUID variantId = request.variantId();

        BigDecimal hd = request.hargaDasar();
        BigDecimal dp = request.downPayment() != null ? request.downPayment() : getSuggestedDp(hd);
        BigDecimal cash = request.cashPrice() != null ? request.cashPrice() : hd;

        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new NotFoundException("Store not found: " + storeId));
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new NotFoundException("Product variant not found: " + variantId));

        StoreProductPrice price = priceRepository.findByStoreIdAndProductVariantId(storeId, variantId)
                .orElseGet(() -> {
                    StoreProductPrice p = new StoreProductPrice();
                    p.setStore(store);
                    p.setProductVariant(variant);
                    return p;
                });

        price.setBasePrice(hd);
        price.setDownPayment(dp);
        price.setCashPrice(cash);
        final StoreProductPrice savedPrice = priceRepository.save(price);

        List<Integer> terms = (request.termMonths() != null && !request.termMonths().isEmpty())
                ? request.termMonths()
                : DEFAULT_TERMS;

        for (int term : terms) {
            CalculatedTermItem calc = calculateInstallment(hd, dp, term);
            StoreProductPaymentPlan plan = planRepository
                    .findByStoreProductPriceIdAndTermMonths(savedPrice.getId(), term)
                    .orElseGet(() -> {
                        StoreProductPaymentPlan p = new StoreProductPaymentPlan();
                        p.setStoreProductPrice(savedPrice);
                        p.setTermMonths(term);
                        return p;
                    });

            plan.setTotalPrice(calc.totalPrice());
            plan.setMonthlyInstallment(calc.monthlyInstallment());
            plan.setActive(true);
            planRepository.save(plan);
        }

        return savedPrice;
    }

    /**
     * Batch auto-applies the formula to all existing priced variants in a store.
     */
    @Transactional
    public int autoApplyAllForStore(UUID storeId) {
        List<StoreProductPrice> prices = priceRepository.findByStoreId(storeId);
        int updated = 0;
        for (StoreProductPrice p : prices) {
            BigDecimal hd = p.getBasePrice() != null ? p.getBasePrice() : p.getCashPrice();
            if (hd == null || hd.compareTo(BigDecimal.ZERO) <= 0) continue;

            BigDecimal dp = p.getDownPayment() != null && p.getDownPayment().compareTo(BigDecimal.ZERO) > 0
                    ? p.getDownPayment()
                    : getSuggestedDp(hd);

            autoApplyPricing(new AutoApplyPricingRequest(
                    storeId,
                    p.getProductVariant().getId(),
                    hd,
                    dp,
                    p.getCashPrice(),
                    DEFAULT_TERMS
            ));
            updated++;
        }
        return updated;
    }

    private BigDecimal toThousands(BigDecimal val) {
        if (val == null) return BigDecimal.ZERO;
        if (val.compareTo(BigDecimal.valueOf(10_000)) >= 0) {
            return val.divide(BigDecimal.valueOf(1000), 4, RoundingMode.HALF_UP);
        }
        return val;
    }
}
