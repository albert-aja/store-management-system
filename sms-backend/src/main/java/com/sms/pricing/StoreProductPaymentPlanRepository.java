package com.sms.pricing;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreProductPaymentPlanRepository extends JpaRepository<StoreProductPaymentPlan, UUID> {

    List<StoreProductPaymentPlan> findByStoreProductPriceIdOrderByTermMonths(UUID storeProductPriceId);

    Optional<StoreProductPaymentPlan> findByStoreProductPriceIdAndTermMonths(UUID storeProductPriceId, int termMonths);
}
