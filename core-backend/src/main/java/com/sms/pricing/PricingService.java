package com.sms.pricing;

import com.sms.common.web.NotFoundException;
import com.sms.foundation.store.StoreRepository;
import com.sms.product.repository.ProductVariantRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class PricingService {

    private final StoreProductPriceRepository priceRepository;
    private final StoreProductPaymentPlanRepository planRepository;
    private final StoreRepository storeRepository;
    private final ProductVariantRepository variantRepository;

    @Transactional(readOnly = true)
    public List<StoreProductPrice> listByStore(UUID storeId) {
        return priceRepository.findByStoreId(storeId);
    }

    public StoreProductPrice upsertPrice(UUID storeId, UUID variantId, BigDecimal cashPrice) {
        return upsertPrice(storeId, variantId, cashPrice, cashPrice, BigDecimal.ZERO);
    }

    /** Creates the price row on first call, otherwise updates cash price, base price, and DP in place. */
    public StoreProductPrice upsertPrice(UUID storeId, UUID variantId, BigDecimal cashPrice, BigDecimal basePrice, BigDecimal downPayment) {
        BigDecimal actualBasePrice = basePrice != null ? basePrice : cashPrice;
        BigDecimal actualDownPayment = downPayment != null ? downPayment : BigDecimal.ZERO;

        return priceRepository.findByStoreIdAndProductVariantId(storeId, variantId)
                .map(existing -> {
                    existing.setCashPrice(cashPrice);
                    existing.setBasePrice(actualBasePrice);
                    existing.setDownPayment(actualDownPayment);
                    return existing;
                })
                .orElseGet(() -> {
                    StoreProductPrice price = new StoreProductPrice();
                    price.setStore(storeRepository.findById(storeId)
                            .orElseThrow(() -> new NotFoundException("Store not found: " + storeId)));
                    price.setProductVariant(variantRepository.findById(variantId)
                            .orElseThrow(() -> new NotFoundException("Variant not found: " + variantId)));
                    price.setCashPrice(cashPrice);
                    price.setBasePrice(actualBasePrice);
                    price.setDownPayment(actualDownPayment);
                    return priceRepository.save(price);
                });
    }

    public void setPriceActive(UUID priceId, boolean active) {
        getPrice(priceId).setActive(active);
    }

    @Transactional(readOnly = true)
    public StoreProductPrice getPrice(UUID priceId) {
        return priceRepository.findById(priceId)
                .orElseThrow(() -> new NotFoundException("Store product price not found: " + priceId));
    }

    @Transactional(readOnly = true)
    public List<StoreProductPaymentPlan> listPaymentPlans(UUID priceId) {
        return planRepository.findByStoreProductPriceIdOrderByTermMonths(priceId);
    }

    public StoreProductPaymentPlan upsertPaymentPlan(UUID priceId, int termMonths, BigDecimal totalPrice) {
        BigDecimal monthly = (termMonths > 0 && totalPrice != null)
                ? totalPrice.divide(BigDecimal.valueOf(termMonths), 0, java.math.RoundingMode.HALF_UP)
                : totalPrice;
        return upsertPaymentPlan(priceId, termMonths, totalPrice, monthly);
    }

    public StoreProductPaymentPlan upsertPaymentPlan(UUID priceId, int termMonths, BigDecimal totalPrice, BigDecimal monthlyInstallment) {
        StoreProductPrice price = getPrice(priceId);
        return planRepository.findByStoreProductPriceIdAndTermMonths(priceId, termMonths)
                .map(existing -> {
                    existing.setTotalPrice(totalPrice);
                    existing.setMonthlyInstallment(monthlyInstallment);
                    return existing;
                })
                .orElseGet(() -> {
                    StoreProductPaymentPlan plan = new StoreProductPaymentPlan();
                    plan.setStoreProductPrice(price);
                    plan.setTermMonths(termMonths);
                    plan.setTotalPrice(totalPrice);
                    plan.setMonthlyInstallment(monthlyInstallment);
                    return planRepository.save(plan);
                });
    }

    public void setPaymentPlanActive(UUID planId, boolean active) {
        StoreProductPaymentPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new NotFoundException("Payment plan not found: " + planId));
        plan.setActive(active);
    }
}
