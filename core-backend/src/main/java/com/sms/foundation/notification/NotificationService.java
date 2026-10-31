package com.sms.foundation.notification;

import com.sms.common.web.NotFoundException;
import com.sms.foundation.employee.Employee;
import com.sms.foundation.employee.EmployeeRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationRecipientRepository recipientRepository;
    private final EmployeeRepository employeeRepository;
    private final PushNotificationDispatcher pushNotificationDispatcher;

    public Notification create(String referenceType, UUID referenceId, String title, String body,
                                List<UUID> recipientEmployeeIds) {
        Notification notification = new Notification();
        notification.setReferenceType(referenceType);
        notification.setReferenceId(referenceId);
        notification.setTitle(title);
        notification.setBody(body);
        notification = notificationRepository.save(notification);

        for (UUID employeeId : recipientEmployeeIds) {
            Employee employee = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new NotFoundException("Employee not found: " + employeeId));
            NotificationRecipient recipient = new NotificationRecipient();
            recipient.setNotification(notification);
            recipient.setEmployee(employee);
            recipientRepository.save(recipient);
        }

        // D.4: Realtime push notification dispatch to mobile devices and active web sessions
        if (pushNotificationDispatcher != null && recipientEmployeeIds != null && !recipientEmployeeIds.isEmpty()) {
            pushNotificationDispatcher.dispatchPush(referenceType, referenceId, title, body, recipientEmployeeIds);
        }

        return notification;
    }

    @Transactional(readOnly = true)
    public List<NotificationRecipient> listForEmployee(UUID employeeId, boolean unreadOnly) {
        return unreadOnly
                ? recipientRepository.findByEmployeeIdAndReadAtIsNullOrderByCreatedAtDesc(employeeId)
                : recipientRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId);
    }

    public void markRead(UUID recipientId) {
        NotificationRecipient recipient = recipientRepository.findById(recipientId)
                .orElseThrow(() -> new NotFoundException("Notification recipient not found: " + recipientId));
        recipient.setReadAt(Instant.now());
    }
}
