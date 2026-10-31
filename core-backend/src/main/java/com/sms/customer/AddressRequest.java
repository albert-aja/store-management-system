package com.sms.customer;

import jakarta.validation.constraints.NotBlank;

public record AddressRequest(String label, @NotBlank String addressLine, String notes, boolean primary) {
}
