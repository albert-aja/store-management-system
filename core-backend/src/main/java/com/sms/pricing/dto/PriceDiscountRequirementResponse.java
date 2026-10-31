package com.sms.pricing.dto;

import java.util.UUID;

public record PriceDiscountRequirementResponse(
        UUID productVariantId,
        String productName,
        String variantName,
        String sku,
        int quantity
) {}