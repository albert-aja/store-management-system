package com.sms.foundation.approval;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record WorkflowStepRequest(
        @Positive int stepOrder,
        @NotBlank String name,
        @NotBlank String approverRoleCode,
        String description) {
}
