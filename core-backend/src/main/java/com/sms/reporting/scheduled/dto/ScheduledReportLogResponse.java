package com.sms.reporting.scheduled.dto;

import com.sms.reporting.scheduled.ExecutionStatus;
import com.sms.reporting.scheduled.ReportType;
import com.sms.reporting.scheduled.ScheduledReportLog;
import java.time.Instant;
import java.util.UUID;

public record ScheduledReportLogResponse(
        UUID id,
        UUID configId,
        String configName,
        Instant executedAt,
        ReportType reportType,
        ExecutionStatus status,
        int recipientsCount,
        String recipientEmails,
        String attachmentsGenerated,
        long durationMs,
        String errorMessage
) {
    public static ScheduledReportLogResponse from(ScheduledReportLog l) {
        return new ScheduledReportLogResponse(
                l.getId(),
                l.getConfig() != null ? l.getConfig().getId() : null,
                l.getConfig() != null ? l.getConfig().getName() : "Direct Dispatch",
                l.getExecutedAt(),
                l.getReportType(),
                l.getStatus(),
                l.getRecipientsCount(),
                l.getRecipientEmails(),
                l.getAttachmentsGenerated(),
                l.getDurationMs(),
                l.getErrorMessage()
        );
    }
}
