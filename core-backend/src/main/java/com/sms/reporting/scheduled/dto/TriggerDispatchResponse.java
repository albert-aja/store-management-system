package com.sms.reporting.scheduled.dto;

import java.util.List;
import java.util.UUID;

public record TriggerDispatchResponse(
        boolean success,
        String message,
        UUID logId,
        int recipientsDispatched,
        List<String> recipientEmails,
        List<String> attachments,
        long durationMs
) {}
