package com.sms.task.dto;

import jakarta.validation.constraints.NotBlank;

public record AddTaskCommentRequest(
        @NotBlank(message = "Comment message cannot be blank")
        String message,

        String attachmentUrl
) {}

