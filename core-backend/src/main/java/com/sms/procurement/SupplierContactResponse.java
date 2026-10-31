package com.sms.procurement;

import java.util.UUID;

public record SupplierContactResponse(
        UUID id, String contactType, String label, String value, String notes, boolean active) {

    public static SupplierContactResponse from(SupplierContact c) {
        return new SupplierContactResponse(c.getId(), c.getContactType(), c.getLabel(), c.getValue(), c.getNotes(), c.isActive());
    }
}
