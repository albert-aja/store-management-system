package com.sms.pricing;

import java.math.BigDecimal;
import java.util.UUID;

public record PriceResponse(
        UUID id,
        UUID storeId,
        UUID productVariantId,
        String variantName,
        String productName,
        BigDecimal cashPrice,
        BigDecimal basePrice,
        BigDecimal downPayment,
        boolean active
) {
    public static PriceResponse from(StoreProductPrice p) {
        return new PriceResponse(
                p.getId(),
                p.getStore().getId(),
                p.getProductVariant().getId(),
                p.getProductVariant().getVariantName(),
                p.getProductVariant().getProduct().getName(),
                p.getCashPrice(),
                p.getBasePrice() != null ? p.getBasePrice() : p.getCashPrice(),
                p.getDownPayment() != null ? p.getDownPayment() : BigDecimal.ZERO,
                p.isActive()
        );
    }
}
