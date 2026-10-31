package com.sms.storefront.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record StorefrontProductDetailDto(
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
        List<String> imageUrls,
        String commercialAvailability,
        int leadTimeDays,
        long totalStockCount,
        List<StorefrontVariantDto> variants,
        Map<String, String> specifications,
        boolean flashSale,
        Instant flashSaleEndsAt
) {
    public StorefrontProductDetailDto(
            UUID id,
            String name,
            String code,
            String description,
            String brandName,
            String categoryName,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            List<String> imageUrls,
            String commercialAvailability,
            int leadTimeDays,
            long totalStockCount,
            List<StorefrontVariantDto> variants,
            Map<String, String> specifications
    ) {
        this(id, name, code, description, brandName, categoryName, minPrice, maxPrice, minPrice, false, 0, imageUrls, commercialAvailability, leadTimeDays, totalStockCount, variants, specifications, false, null);
        }

        public StorefrontProductDetailDto(UUID id, String name, String code, String description,
            String brandName, String categoryName, BigDecimal minPrice, BigDecimal maxPrice,
            BigDecimal originalMinPrice, boolean hasDiscount, int maxDiscountPercent,
            List<String> imageUrls, String commercialAvailability, int leadTimeDays,
            long totalStockCount, List<StorefrontVariantDto> variants, Map<String, String> specifications) {
        this(id, name, code, description, brandName, categoryName, minPrice, maxPrice,
            originalMinPrice, hasDiscount, maxDiscountPercent, imageUrls, commercialAvailability,
            leadTimeDays, totalStockCount, variants, specifications, false, null);
    }

    public record StorefrontVariantDto(
            UUID id,
            String name,
            String sku,
            BigDecimal price,
            BigDecimal originalPrice,
            BigDecimal discountAmount,
            int discountPercent,
            boolean hasDiscount,
            String discountLabel,
            long stockCount,
            String commercialAvailability,
            int leadTimeDays,
            Map<String, String> attributes,
            boolean flashSale,
            Instant flashSaleEndsAt
    ) {
        public StorefrontVariantDto(
                UUID id,
                String name,
                String sku,
                BigDecimal price,
                long stockCount,
                String commercialAvailability,
                int leadTimeDays,
                Map<String, String> attributes
        ) {
            this(id, name, sku, price, price, BigDecimal.ZERO, 0, false, null, stockCount, commercialAvailability, leadTimeDays, attributes, false, null);
        }
    }
}
