package com.sms.foundation.approval;

import com.sms.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Snapshot of a workflow step at request-creation time; later workflow edits never touch this row. */
@Entity
@Table(name = "approval_request_step", uniqueConstraints = @UniqueConstraint(columnNames = {"request_id", "step_order"}))
@Getter
@Setter
@NoArgsConstructor
public class ApprovalRequestStep extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "request_id")
    private ApprovalRequest request;

    @Column(name = "step_order", nullable = false)
    private int stepOrder;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "approver_role_code", nullable = false, length = 40)
    private String approverRoleCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StepStatus status = StepStatus.PENDING;

    @Column(name = "decided_by")
    private UUID decidedBy;

    @Column(name = "decided_at")
    private Instant decidedAt;

    @Column(length = 500)
    private String comment;
}
