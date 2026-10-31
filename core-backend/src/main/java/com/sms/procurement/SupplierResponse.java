package com.sms.procurement;

import java.util.UUID;

public record SupplierResponse(UUID id, String name, String code, String address, String notes, boolean active) {

    public static SupplierResponse from(Supplier s) {
        return new SupplierResponse(s.getId(), s.getName(), s.getCode(), s.getAddress(), s.getNotes(), s.isActive());
    }
}
