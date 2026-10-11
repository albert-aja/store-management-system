package com.sms.foundation.document;

import java.time.Instant;
import java.util.UUID;

public record DocumentResponse(
        UUID id, String ownerType, UUID ownerId, String storageBucket, String storagePath,
        String fileName, String mimeType, UUID uploadedBy, Instant uploadedAt) {

    public static DocumentResponse from(DocumentRecord d) {
        return new DocumentResponse(d.getId(), d.getOwnerType(), d.getOwnerId(), d.getStorageBucket(),
                d.getStoragePath(), d.getFileName(), d.getMimeType(), d.getUploadedBy(), d.getUploadedAt());
    }
}
