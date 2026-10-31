package com.sms.fleet;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TrackingSessionEventRepository extends JpaRepository<TrackingSessionEvent, UUID> {
    List<TrackingSessionEvent> findByTrackingSessionIdOrderByEventTimestampAsc(UUID trackingSessionId);
}

