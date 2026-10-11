package com.sms.foundation.approval;

import java.time.Instant;
import java.util.UUID;

public record ApprovalRequestResponse(
        UUID id, String workflowCode, String referenceType, UUID referenceId,
        ApprovalStatus status, int currentStepOrder, UUID requestedBy, Instant requestedAt, Instant decidedAt) {

    public static ApprovalRequestResponse from(ApprovalRequest r) {
        return new ApprovalRequestResponse(r.getId(), r.getWorkflow().getCode(), r.getReferenceType(),
                r.getReferenceId(), r.getStatus(), r.getCurrentStepOrder(), r.getRequestedBy(),
                r.getRequestedAt(), r.getDecidedAt());
    }
}
