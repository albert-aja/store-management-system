package com.sms.pricing.dto;

import com.sms.pricing.DiscountType;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record DiscountCalculationResult(
        BigDecimal originalPrice,
        BigDecimal discountedPrice,
        BigDecimal discountAmount,
        int discountPercentage,
        UUID appliedDiscountId,
        String appliedDiscountName,
        DiscountType discountType,
        boolean isDiscounted,
        boolean flashSale,
        Instant validUntil
) {
    public static DiscountCalculationResult noDiscount(BigDecimal price) {
        return new DiscountCalculationResult(
                price,
                price,
                BigDecimal.ZERO,
                0,
                null,
                null,
                null,
                false,
                false,
                null
        );
    }
}

