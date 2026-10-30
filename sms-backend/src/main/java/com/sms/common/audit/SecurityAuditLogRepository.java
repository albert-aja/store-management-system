package com.sms.common.audit;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface SecurityAuditLogRepository extends JpaRepository<SecurityAuditLog, UUID> {

    List<SecurityAuditLog> findByStoreIdOrderByCreatedAtDesc(UUID storeId);

    List<SecurityAuditLog> findByEventTypeOrderByCreatedAtDesc(String eventType);

    @Query("SELECT s FROM SecurityAuditLog s WHERE (:storeId IS NULL OR s.storeId = :storeId) AND (:eventType IS NULL OR s.eventType = :eventType) ORDER BY s.createdAt DESC")
    List<SecurityAuditLog> search(UUID storeId, String eventType);
}

