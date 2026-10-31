package com.sms.pricing.dto;

import com.sms.pricing.DiscountType;
import com.sms.pricing.DiscountScope;
import com.sms.pricing.PriceDiscount;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PriceDiscountResponse(
        UUID id,
        UUID storeId,
        String storeName,
        UUID productId,
        String productName,
        UUID productVariantId,
        String variantName,
        String discountName,
        DiscountType discountType,
        DiscountScope discountScope,
        BigDecimal discountValue,
        BigDecimal minOrderAmount,
        BigDecimal maxDiscountAmount,
        int minQuantity,
        Instant validFrom,
        Instant validUntil,
        boolean active,
        boolean flashSale,
        int priority,
        String notes,
        List<PriceDiscountRequirementResponse> requirements,
        Instant createdAt,
        Instant updatedAt
) {
    public static PriceDiscountResponse from(PriceDiscount d) {
        return new PriceDiscountResponse(
                d.getId(),
                d.getStore() != null ? d.getStore().getId() : null,
                d.getStore() != null ? d.getStore().getName() : "All Stores",
                d.getProduct() != null ? d.getProduct().getId() : null,
                d.getProduct() != null ? d.getProduct().getName() : null,
                d.getProductVariant() != null ? d.getProductVariant().getId() : null,
                d.getProductVariant() != null ? d.getProductVariant().getVariantName() : null,
                d.getDiscountName(),
                d.getDiscountType(),
                d.getDiscountScope() != null ? d.getDiscountScope() : DiscountScope.UNIT,
                d.getDiscountValue(),
                d.getMinOrderAmount() != null ? d.getMinOrderAmount() : BigDecimal.ZERO,
                d.getMaxDiscountAmount(),
                d.getMinQuantity(),
                d.getValidFrom(),
                d.getValidUntil(),
                d.isActive(),
                d.isFlashSale(),
                d.getPriority(),
                d.getNotes(),
                d.getRequirements() == null ? List.of() : d.getRequirements().stream()
                    .map(r -> new PriceDiscountRequirementResponse(
                        r.getProductVariant().getId(),
                        r.getProductVariant().getProduct() != null ? r.getProductVariant().getProduct().getName() : null,
                        r.getProductVariant().getVariantName(),
                        r.getProductVariant().getSku(),
                        r.getRequiredQuantity()))
                    .toList(),
                d.getCreatedAt(),
                d.getUpdatedAt()
        );
    }
}

