package com.sms.fleet;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TrackingSessionRepository extends JpaRepository<TrackingSession, UUID> {
    List<TrackingSession> findByEmployeeIdOrderByStartTimeDesc(UUID employeeId);
    List<TrackingSession> findByStatus(TrackingSessionStatus status);
    Optional<TrackingSession> findFirstByEmployeeIdAndStatusInOrderByStartTimeDesc(UUID employeeId, List<TrackingSessionStatus> statuses);

    @Query("SELECT s FROM TrackingSession s WHERE s.status IN ('ACTIVE', 'PAUSED', 'INTERRUPTED')")
    List<TrackingSession> findActiveOrPausedSessions();

    List<TrackingSession> findByVehicleIdOrderByStartTimeDesc(UUID vehicleId);
}

