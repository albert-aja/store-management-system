package com.sms.customer;

import jakarta.validation.constraints.NotBlank;

public record CustomerRequest(
        @NotBlank String fullName,
        String nik,
        String primaryPhone,
        String primaryEmail) {
}
