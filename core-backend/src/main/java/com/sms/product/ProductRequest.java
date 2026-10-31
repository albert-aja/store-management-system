package com.sms.product;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record ProductRequest(@NotBlank String name, UUID categoryId, UUID brandId, String description) {
}
