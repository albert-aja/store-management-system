package com.sms.storefront.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AddToCartRequest(
        @NotNull UUID variantId,
        @Min(1) int quantity
) {}

