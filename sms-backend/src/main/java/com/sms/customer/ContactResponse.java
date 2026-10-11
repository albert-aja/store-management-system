package com.sms.customer;

import java.util.UUID;

public record ContactResponse(
        UUID id, String contactType, String label, String value, String notes, boolean active) {

    public static ContactResponse from(CustomerContact c) {
        return new ContactResponse(c.getId(), c.getContactType(), c.getLabel(), c.getValue(), c.getNotes(), c.isActive());
    }
}
