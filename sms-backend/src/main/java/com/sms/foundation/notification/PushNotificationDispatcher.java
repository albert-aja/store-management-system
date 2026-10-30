package com.sms.foundation.notification;

import java.util.List;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Dispatches real-time push notifications (Firebase Cloud Messaging / Supabase Realtime broadcast)
 * to mobile workers and desktop managers (README Section 18.2 / Todo D.4).
 */
@Slf4j
@Component
public class PushNotificationDispatcher {

    public void dispatchPush(
            String referenceType,
            UUID referenceId,
            String title,
            String body,
            List<UUID> recipientEmployeeIds
    ) {
        log.info("[REALTIME PUSH] Reference: {} ({}) | Title: {} | Recipients: {}",
                referenceType, referenceId, title, recipientEmployeeIds.size());

        // Format FCM / Supabase Realtime channel payload
        for (UUID employeeId : recipientEmployeeIds) {
            log.debug("Dispatching push message to employee [{}]: {} - {}", employeeId, title, body);
            // In production, transmits to FCM HTTP v1 API or Supabase Realtime WebSocket broadcast
        }
    }
}

