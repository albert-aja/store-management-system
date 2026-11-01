package com.sms.reporting.scheduled;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ScheduledReportConfigRepository extends JpaRepository<ScheduledReportConfig, UUID> {

    List<ScheduledReportConfig> findByEnabledTrue();

    @Query("SELECT c FROM ScheduledReportConfig c WHERE (:storeId IS NULL OR c.store.id = :storeId) ORDER BY c.createdAt DESC")
    List<ScheduledReportConfig> search(@Param("storeId") UUID storeId);
}
