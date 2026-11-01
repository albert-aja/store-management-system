package com.sms.task.dto;

import java.time.Instant;
import java.util.UUID;

public record TaskCommentDto(
        UUID id,
        UUID taskId,
        UUID authorId,
        String authorName,
        String message,
        String attachmentUrl,
        Instant createdAt
) {}

