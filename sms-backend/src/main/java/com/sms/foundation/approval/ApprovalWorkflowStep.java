package com.sms.foundation.approval;

import com.sms.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "approval_workflow_step", uniqueConstraints = @UniqueConstraint(columnNames = {"workflow_id", "step_order"}))
@Getter
@Setter
@NoArgsConstructor
public class ApprovalWorkflowStep extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workflow_id")
    private ApprovalWorkflow workflow;

    @Column(name = "step_order", nullable = false)
    private int stepOrder;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "approver_role_code", nullable = false, length = 40)
    private String approverRoleCode;

    @Column(length = 300)
    private String description;
}
