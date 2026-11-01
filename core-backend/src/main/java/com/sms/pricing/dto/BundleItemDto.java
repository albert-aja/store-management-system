package com.sms.pricing.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record BundleItemDto(
        UUID productVariantId,
        String name,
        String category,
        int quantity,
        BigDecimal hargaDasar,
        BigDecimal cashPrice
) {}

