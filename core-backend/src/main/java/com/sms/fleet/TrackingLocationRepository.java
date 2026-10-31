package com.sms.fleet;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TrackingLocationRepository extends JpaRepository<TrackingLocation, UUID> {
    List<TrackingLocation> findByTrackingSessionIdOrderByRecordedAtAsc(UUID trackingSessionId);

    @Query("SELECT l FROM TrackingLocation l WHERE l.trackingSession.id = :sessionId AND l.recordedAt >= :fromTime ORDER BY l.recordedAt ASC")
    List<TrackingLocation> findBySessionSince(@Param("sessionId") UUID sessionId, @Param("fromTime") Instant fromTime);

    Optional<TrackingLocation> findFirstByTrackingSessionIdOrderByRecordedAtDesc(UUID trackingSessionId);
    Optional<TrackingLocation> findFirstByEmployeeIdOrderByRecordedAtDesc(UUID employeeId);
}

