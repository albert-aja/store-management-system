package com.sms.customer;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record CustomerRequest(
        @NotBlank String fullName,
        String nik,
        String primaryPhone,
        String primaryEmail,
        UUID salesOrderId,
        String creationContext) {

    public CustomerRequest(String fullName, String nik, String primaryPhone, String primaryEmail) {
        this(fullName, nik, primaryPhone, primaryEmail, null, null);
    }
}
