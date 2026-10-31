package com.sms.product;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record ComponentRequest(@NotBlank String name, @Positive int quantity, String notes) {
}
