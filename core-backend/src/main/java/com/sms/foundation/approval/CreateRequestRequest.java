package com.sms.foundation.approval;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateRequestRequest(
        @NotBlank String workflowCode,
        @NotBlank String referenceType,
        @NotNull UUID referenceId) {
}
