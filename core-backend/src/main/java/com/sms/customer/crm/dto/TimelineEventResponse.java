package com.sms.customer.crm.dto;

import java.time.Instant;
import java.util.UUID;

public record TimelineEventResponse(
        String id,
        String eventType, // SALES_ORDER, SURVEY, DELIVERY, PAYMENT, REPOSSESSION, INTERACTION, PTP, FOLLOW_UP, STORE_CREDIT
        String title,
        String description,
        String status,
        Instant timestamp,
        String referenceCode,
        UUID referenceId,
        String badgeColor
) {}

