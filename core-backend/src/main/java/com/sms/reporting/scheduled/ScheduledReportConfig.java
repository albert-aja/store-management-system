package com.sms.reporting.scheduled;

import com.sms.common.audit.BaseEntity;
import com.sms.foundation.store.Store;
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
@Table(name = "scheduled_report_config")
@Getter
@Setter
@NoArgsConstructor
public class ScheduledReportConfig extends BaseEntity {

    @Column(nullable = false, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "report_type", nullable = false, length = 40)
    private ReportType reportType = ReportType.ALL_COMBINED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ScheduleFrequency frequency = ScheduleFrequency.DAILY;

    @Column(name = "day_of_week", length = 20)
    private String dayOfWeek; // e.g. MONDAY, TUESDAY, etc.

    @Column(name = "dispatch_time", nullable = false, length = 10)
    private String dispatchTime = "08:00";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store; // null = all stores

    @Column(name = "target_role", nullable = false, length = 40)
    private String targetRole = "MANAGER";

    @Column(name = "custom_recipient_emails", columnDefinition = "TEXT")
    private String customRecipientEmails;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "last_run_at")
    private Instant lastRunAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "last_status", length = 20)
    private ExecutionStatus lastStatus;

    @Column(name = "last_error_message", columnDefinition = "TEXT")
    private String lastErrorMessage;
}
