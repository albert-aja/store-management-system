package com.sms.reporting.scheduled.dto;

import com.sms.reporting.scheduled.ExecutionStatus;
import com.sms.reporting.scheduled.ReportType;
import com.sms.reporting.scheduled.ScheduleFrequency;
import com.sms.reporting.scheduled.ScheduledReportConfig;
import java.time.Instant;
import java.util.UUID;

public record ScheduledReportConfigResponse(
        UUID id,
        String name,
        ReportType reportType,
        ScheduleFrequency frequency,
        String dayOfWeek,
        String dispatchTime,
        UUID storeId,
        String storeName,
        String targetRole,
        String customRecipientEmails,
        boolean enabled,
        Instant lastRunAt,
        ExecutionStatus lastStatus,
        String lastErrorMessage,
        Instant createdAt
) {
    public static ScheduledReportConfigResponse from(ScheduledReportConfig c) {
        return new ScheduledReportConfigResponse(
                c.getId(),
                c.getName(),
                c.getReportType(),
                c.getFrequency(),
                c.getDayOfWeek(),
                c.getDispatchTime(),
                c.getStore() != null ? c.getStore().getId() : null,
                c.getStore() != null ? c.getStore().getName() : null,
                c.getTargetRole(),
                c.getCustomRecipientEmails(),
                c.isEnabled(),
                c.getLastRunAt(),
                c.getLastStatus(),
                c.getLastErrorMessage(),
                c.getCreatedAt()
        );
    }
}
