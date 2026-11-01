package com.sms.task.dto;

import com.sms.task.TaskStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateTaskStatusRequest(
        @NotNull(message = "Task status is required")
        TaskStatus status,

        String completionNotes
) {}

