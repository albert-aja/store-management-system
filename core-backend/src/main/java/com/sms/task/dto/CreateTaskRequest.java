package com.sms.task.dto;

import com.sms.task.TaskCategory;
import com.sms.task.TaskPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public record CreateTaskRequest(
        @NotBlank(message = "Title is required")
        String title,

        String description,

        TaskCategory category,

        TaskPriority priority,

        Instant dueDate,

        @NotNull(message = "Assignee employee ID is required")
        UUID assigneeId,

        UUID storeId
) {}

