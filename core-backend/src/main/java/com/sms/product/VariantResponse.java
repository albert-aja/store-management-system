package com.sms.product;

import com.sms.product.dto.ProductVariant;
import java.util.UUID;

public record VariantResponse(UUID id, String sku, String variantName, boolean active) {

    public static VariantResponse from(ProductVariant v) {
        return new VariantResponse(v.getId(), v.getSku(), v.getVariantName(), v.isActive());
    }
}
