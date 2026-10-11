package com.sms.procurement;

import jakarta.validation.constraints.NotBlank;

public record SupplierRequest(@NotBlank String name, String code, String address, String notes) {
}
