package com.sms.pricing;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PriceDiscountRepository extends JpaRepository<PriceDiscount, UUID> {

    List<PriceDiscount> findByActiveTrueOrderByPriorityDesc();

    List<PriceDiscount> findByStoreIdOrderByPriorityDesc(UUID storeId);

    @Query("""
        SELECT DISTINCT d FROM PriceDiscount d
        LEFT JOIN FETCH d.requirements r
        WHERE d.active = true
          AND d.validFrom <= :now
          AND d.validUntil >= :now
          AND d.discountScope IN (com.sms.pricing.DiscountScope.ORDER_TOTAL, com.sms.pricing.DiscountScope.BUNDLE)
          AND (d.store IS NULL OR d.store.id = :storeId)
        ORDER BY d.priority DESC, d.createdAt DESC
    """)
    List<PriceDiscount> findActiveCartDiscounts(@Param("storeId") UUID storeId, @Param("now") Instant now);

    @Query("""
        SELECT d FROM PriceDiscount d
        WHERE d.active = true
          AND d.validFrom <= :now
          AND d.validUntil >= :now
        ORDER BY d.priority DESC, d.createdAt DESC
    """)
    List<PriceDiscount> findActiveDiscounts(@Param("now") Instant now);

    @Query("""
        SELECT d FROM PriceDiscount d
        WHERE d.active = true
          AND d.validFrom <= :now
          AND d.validUntil >= :now
          AND (d.store IS NULL OR d.store.id = :storeId)
          AND (
               d.productVariant.id = :variantId
            OR (d.productVariant IS NULL AND d.product.id = :productId)
            OR (d.productVariant IS NULL AND d.product IS NULL)
          )
        ORDER BY d.priority DESC, d.discountValue DESC
    """)
    List<PriceDiscount> findActiveDiscountsForVariant(
            @Param("storeId") UUID storeId,
            @Param("variantId") UUID variantId,
            @Param("productId") UUID productId,
            @Param("now") Instant now);
}

