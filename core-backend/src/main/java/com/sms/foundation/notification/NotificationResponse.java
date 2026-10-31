package com.sms.foundation.notification;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID recipientId, UUID notificationId, String title, String body,
        String referenceType, UUID referenceId, Instant createdAt, Instant readAt) {

    public static NotificationResponse from(NotificationRecipient r) {
        Notification n = r.getNotification();
        return new NotificationResponse(r.getId(), n.getId(), n.getTitle(), n.getBody(),
                n.getReferenceType(), n.getReferenceId(), n.getCreatedAt(), r.getReadAt());
    }
}
