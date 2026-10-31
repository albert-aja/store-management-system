package com.sms.storefront.repository;

import com.sms.storefront.model.StorefrontPushNotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StorefrontPushNotificationLogRepository extends JpaRepository<StorefrontPushNotificationLog, String> {
    List<StorefrontPushNotificationLog> findByCustomerIdOrderBySentAtDesc(UUID customerId);
    List<StorefrontPushNotificationLog> findByOrderNumberOrderBySentAtDesc(String orderNumber);
    long countByCustomerIdAndReadFalse(UUID customerId);
}
