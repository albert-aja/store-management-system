package com.sms.reporting.scheduled.dto;

import com.sms.reporting.scheduled.ReportType;
import com.sms.reporting.scheduled.ScheduleFrequency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ScheduledReportConfigRequest(
        @NotBlank String name,
        @NotNull ReportType reportType,
        @NotNull ScheduleFrequency frequency,
        String dayOfWeek,
        @NotBlank String dispatchTime,
        UUID storeId,
        String targetRole,
        String customRecipientEmails,
        Boolean enabled
) {}
