package com.sms.reporting.scheduled;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ScheduledReportLogRepository extends JpaRepository<ScheduledReportLog, UUID> {

    List<ScheduledReportLog> findByConfigIdOrderByExecutedAtDesc(UUID configId);

    @Query("SELECT l FROM ScheduledReportLog l ORDER BY l.executedAt DESC")
    List<ScheduledReportLog> findRecentLogs(Pageable pageable);

    @Query("SELECT l FROM ScheduledReportLog l WHERE (:configId IS NULL OR l.config.id = :configId) ORDER BY l.executedAt DESC")
    List<ScheduledReportLog> search(@Param("configId") UUID configId, Pageable pageable);
}
