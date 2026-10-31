package com.sms.customer;

import java.util.UUID;

public record AddressResponse(
        UUID id, String label, String addressLine, String notes, boolean primary, boolean active) {

    public static AddressResponse from(CustomerAddress a) {
        return new AddressResponse(a.getId(), a.getLabel(), a.getAddressLine(), a.getNotes(), a.isPrimary(), a.isActive());
    }
}
