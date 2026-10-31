package com.sms.fleet;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LocationAccessAuditLogRepository extends JpaRepository<LocationAccessAuditLog, UUID> {
    List<LocationAccessAuditLog> findTop50ByOrderByTimestampDesc();
    List<LocationAccessAuditLog> findByTargetEmployeeIdOrderByTimestampDesc(UUID targetEmployeeId);
}

