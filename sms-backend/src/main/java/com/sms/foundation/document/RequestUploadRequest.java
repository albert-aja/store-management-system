package com.sms.foundation.document;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record RequestUploadRequest(
        @NotBlank String ownerType,
        @NotNull UUID ownerId,
        @NotBlank String fileName,
        String mimeType) {
}
