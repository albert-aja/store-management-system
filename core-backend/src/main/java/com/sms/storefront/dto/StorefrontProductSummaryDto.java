package com.sms.storefront.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record StorefrontProductSummaryDto(
        UUID id,
        String name,
        String code,
        String description,
        String brandName,
        String categoryName,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        BigDecimal originalMinPrice,
        boolean hasDiscount,
        int maxDiscountPercent,
        String discountLabel,
        String primaryImageUrl,
        String commercialAvailability, // IN_STOCK, AVAILABLE_PROCUREMENT_REQUIRED, PREORDER
        int leadTimeDays,
        long inStockCount,
        boolean flashSale,
        Instant flashSaleEndsAt,
        UUID primaryVariantId
) {
    public StorefrontProductSummaryDto(
            UUID id,
            String name,
            String code,
            String description,
            String brandName,
            String categoryName,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String primaryImageUrl,
            String commercialAvailability,
            int leadTimeDays,
            long inStockCount
    ) {
        this(id, name, code, description, brandName, categoryName, minPrice, maxPrice, minPrice, false, 0, null, primaryImageUrl, commercialAvailability, leadTimeDays, inStockCount, false, null, null);
    }

    public StorefrontProductSummaryDto(UUID id, String name, String code, String description,
            String brandName, String categoryName, BigDecimal minPrice, BigDecimal maxPrice,
            BigDecimal originalMinPrice, boolean hasDiscount, int maxDiscountPercent,
            String discountLabel, String primaryImageUrl, String commercialAvailability,
            int leadTimeDays, long inStockCount) {
        this(id, name, code, description, brandName, categoryName, minPrice, maxPrice,
                originalMinPrice, hasDiscount, maxDiscountPercent, discountLabel, primaryImageUrl,
                commercialAvailability, leadTimeDays, inStockCount, false, null, null);
    }
}
