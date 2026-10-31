package com.sms.customer.crm.dto;

import com.sms.customer.crm.FollowUpType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public record FollowUpRequest(
        @NotBlank String title,
        @NotNull FollowUpType followUpType,
        @NotNull Instant scheduledAt,
        UUID assignedEmployeeId,
        String notes
) {}

