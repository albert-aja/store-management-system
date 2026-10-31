package com.sms.customer.crm.dto;

import java.util.List;
import java.util.UUID;

public record DuplicateMatchResult(
        UUID matchedCustomerId,
        String matchedCustomerName,
        String matchedNik,
        String matchedPhone,
        int matchScorePercent, // e.g. 100 for exact NIK/Phone, 80 for fuzzy phonetics
        List<String> matchReasons
) {}

