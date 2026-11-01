package com.sms.task.dto;

import com.sms.task.TaskCategory;
import com.sms.task.TaskPriority;
import com.sms.task.TaskStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TaskDetailDto(
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
        boolean isOverdue,
        List<TaskCommentDto> comments,
        Instant createdAt,
        Instant updatedAt
) {}

