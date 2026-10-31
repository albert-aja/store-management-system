package com.sms.customer.crm.dto;

import com.sms.customer.crm.CustomerInteraction;
import com.sms.customer.crm.InteractionChannel;
import com.sms.customer.crm.InteractionDirection;
import com.sms.customer.crm.InteractionOutcome;
import java.time.Instant;
import java.util.UUID;

public record InteractionResponse(
        UUID id,
        UUID customerId,
        InteractionChannel channel,
        InteractionDirection direction,
        String summary,
        String details,
        InteractionOutcome outcome,
        String recordedByName,
        Instant createdAt
) {
    public static InteractionResponse from(CustomerInteraction i) {
        String recorder = i.getRecordedBy() != null ? i.getRecordedBy().getFullName() : "System / Staff";
        return new InteractionResponse(
                i.getId(),
                i.getCustomer().getId(),
                i.getChannel(),
                i.getDirection(),
                i.getSummary(),
                i.getDetails(),
                i.getOutcome(),
                recorder,
                i.getCreatedAt()
        );
    }
}

