package com.sms.pricing.dto;

import com.sms.pricing.DiscountType;
import com.sms.pricing.DiscountScope;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PriceDiscountRequest(
        UUID storeId,
        UUID productId,
        UUID productVariantId,
        @NotBlank String discountName,
        @NotNull DiscountType discountType,
        @NotNull BigDecimal discountValue,
        BigDecimal minOrderAmount,
        BigDecimal maxDiscountAmount,
        Integer minQuantity,
        @NotNull Instant validFrom,
        @NotNull Instant validUntil,
        Boolean active,
        Integer priority,
        String notes,
        DiscountScope discountScope,
        Boolean flashSale,
        List<PriceDiscountRequirementRequest> requirements
) {
    public PriceDiscountRequest(
            UUID storeId,
            UUID productId,
            UUID productVariantId,
            String discountName,
            DiscountType discountType,
            BigDecimal discountValue,
            BigDecimal minOrderAmount,
            BigDecimal maxDiscountAmount,
            Integer minQuantity,
            Instant validFrom,
            Instant validUntil,
            Boolean active,
            Integer priority,
            String notes) {
        this(storeId, productId, productVariantId, discountName, discountType, discountValue,
                minOrderAmount, maxDiscountAmount, minQuantity, validFrom, validUntil, active,
                priority, notes, DiscountScope.UNIT, false, List.of());
    }
}

