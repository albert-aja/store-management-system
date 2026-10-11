package com.sms.foundation.notification;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;

public record CreateNotificationRequest(
        String referenceType,
        UUID referenceId,
        @NotBlank String title,
        String body,
        @NotEmpty List<UUID> recipientEmployeeIds) {
}
