package com.sms.reporting.scheduled.dto;

import java.util.List;
import java.util.UUID;

public record RecipientPreviewResponse(
        int count,
        UUID storeId,
        String storeName,
        String targetRole,
        List<String> emails,
        List<String> managerNames
) {}
