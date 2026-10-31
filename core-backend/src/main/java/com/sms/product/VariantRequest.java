package com.sms.product;

import jakarta.validation.constraints.NotBlank;

public record VariantRequest(@NotBlank String sku, @NotBlank String variantName) {
}
