package com.sms.reporting.scheduled;

import com.sms.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "scheduled_report_log")
@Getter
@Setter
@NoArgsConstructor
public class ScheduledReportLog extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "config_id")
    private ScheduledReportConfig config;

    @Column(name = "executed_at", nullable = false)
    private Instant executedAt = Instant.now();

    @Enumerated(EnumType.STRING)
    @Column(name = "report_type", nullable = false, length = 40)
    private ReportType reportType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ExecutionStatus status;

    @Column(name = "recipients_count", nullable = false)
    private int recipientsCount = 0;

    @Column(name = "recipient_emails", columnDefinition = "TEXT")
    private String recipientEmails;

    @Column(name = "attachments_generated", columnDefinition = "TEXT")
    private String attachmentsGenerated;

    @Column(name = "duration_ms", nullable = false)
    private long durationMs = 0;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
}
