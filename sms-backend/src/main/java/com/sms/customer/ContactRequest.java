package com.sms.customer;

import jakarta.validation.constraints.NotBlank;

public record ContactRequest(@NotBlank String contactType, String label, @NotBlank String value, String notes) {
}
