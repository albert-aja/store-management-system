package com.sms.procurement;

import jakarta.validation.constraints.NotBlank;

public record SupplierContactRequest(@NotBlank String contactType, String label, @NotBlank String value, String notes) {
}
