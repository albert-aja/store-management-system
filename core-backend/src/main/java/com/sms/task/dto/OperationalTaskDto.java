package com.sms.task.dto;

import com.sms.task.TaskCategory;
import com.sms.task.TaskPriority;
import com.sms.task.TaskStatus;
import java.time.Instant;
import java.util.UUID;

public record OperationalTaskDto(
        UUID id,
        String taskNumber,
        String title,
        String description,
        TaskCategory category,
        TaskPriority priority,
        TaskStatus status,
        Instant dueDate,
        UUID assignerId,
        String assignerName,
        UUID assigneeId,
        String assigneeName,
        UUID storeId,
        Instant completedAt,
        String completionNotes,
        int commentCount,
        boolean isOverdue,
        Instant createdAt,
        Instant updatedAt
) {}

