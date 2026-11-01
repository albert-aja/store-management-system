package com.sms.task.dto;

public record TaskSummaryDto(
        long totalTasks,
        long pendingTasks,
        long inProgressTasks,
        long completedTasks,
        long overdueTasks,
        long myPendingTasks
) {}

