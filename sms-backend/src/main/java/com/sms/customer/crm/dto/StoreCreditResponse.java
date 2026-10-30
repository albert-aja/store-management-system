package com.sms.customer.crm.dto;

import com.sms.customer.crm.StoreCreditEntry;
import com.sms.customer.crm.StoreCreditType;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record StoreCreditResponse(
        UUID id,
        UUID customerId,
        StoreCreditType entryType,
        BigDecimal amount,
        BigDecimal balanceAfter,
        String referenceType,
        UUID referenceId,
        String notes,
        Instant createdAt
) {
    public static StoreCreditResponse from(StoreCreditEntry e) {
        return new StoreCreditResponse(
                e.getId(),
                e.getCustomer().getId(),
                e.getEntryType(),
                e.getAmount(),
                e.getBalanceAfter(),
                e.getReferenceType(),
                e.getReferenceId(),
                e.getNotes(),
                e.getCreatedAt()
        );
    }
}

