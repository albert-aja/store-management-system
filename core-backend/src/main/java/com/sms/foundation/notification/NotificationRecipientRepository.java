package com.sms.foundation.notification;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRecipientRepository extends JpaRepository<NotificationRecipient, UUID> {

    List<NotificationRecipient> findByEmployeeIdOrderByCreatedAtDesc(UUID employeeId);

    List<NotificationRecipient> findByEmployeeIdAndReadAtIsNullOrderByCreatedAtDesc(UUID employeeId);
}
