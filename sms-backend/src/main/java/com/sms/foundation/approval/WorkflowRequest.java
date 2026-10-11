package com.sms.foundation.approval;

import jakarta.validation.constraints.NotBlank;

public record WorkflowRequest(@NotBlank String code, @NotBlank String name, String description) {
}
