package com.sms.pricing.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record DiscountCalculationRequest(
        UUID storeId,
        @NotNull UUID productVariantId,
        UUID productId,
        @NotNull BigDecimal basePrice,
        Integer quantity
) {}

