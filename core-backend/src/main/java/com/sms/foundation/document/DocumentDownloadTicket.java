package com.sms.foundation.document;

import java.util.UUID;

public record DocumentDownloadTicket(
        UUID id,
        String fileName,
        String mimeType,
        String downloadUrl,
        int expiresInSeconds
) {}
