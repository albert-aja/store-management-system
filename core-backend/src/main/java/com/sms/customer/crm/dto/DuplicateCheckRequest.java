package com.sms.customer.crm.dto;

import java.util.UUID;

public record DuplicateCheckRequest(
        UUID currentCustomerId,
        String fullName,
        String phone,
        String nik,
        String motherMaidenName
) {}

