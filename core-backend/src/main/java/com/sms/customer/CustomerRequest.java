package com.sms.customer;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.util.UUID;

public record CustomerRequest(
        @NotBlank String fullName,
        String nik,
        String primaryPhone,
        String primaryEmail,
        UUID salesOrderId,
        String creationContext,
        String motherMaidenName,
        LocalDate birthDate,
        String birthPlace) {

    public CustomerRequest(String fullName, String nik, String primaryPhone, String primaryEmail) {
        this(fullName, nik, primaryPhone, primaryEmail, null, null, null, null, null);
    }

    public CustomerRequest(String fullName, String nik, String primaryPhone, String primaryEmail, UUID salesOrderId, String creationContext) {
        this(fullName, nik, primaryPhone, primaryEmail, salesOrderId, creationContext, null, null, null);
    }
}
