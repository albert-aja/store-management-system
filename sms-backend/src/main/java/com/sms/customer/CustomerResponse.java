package com.sms.customer;

import java.util.UUID;

public record CustomerResponse(
        UUID id, String fullName, String nik, String primaryPhone, String primaryEmail, boolean active) {

    public static CustomerResponse from(Customer c) {
        return new CustomerResponse(c.getId(), c.getFullName(), c.getNik(), c.getPrimaryPhone(), c.getPrimaryEmail(), c.isActive());
    }
}
