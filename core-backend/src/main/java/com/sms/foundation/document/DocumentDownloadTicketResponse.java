package com.sms.foundation.document;

import java.util.UUID;

public record DocumentDownloadTicketResponse(
        UUID id,
        String fileName,
        String mimeType,
        String downloadUrl,
        int expiresInSeconds
) {
    public static DocumentDownloadTicketResponse from(DocumentDownloadTicket t) {
        return new DocumentDownloadTicketResponse(
                t.id(),
                t.fileName(),
                t.mimeType(),
                t.downloadUrl(),
                t.expiresInSeconds()
        );
    }
}
