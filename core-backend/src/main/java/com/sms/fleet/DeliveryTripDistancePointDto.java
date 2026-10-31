package com.sms.fleet;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryTripDistancePointDto {
    private UUID sessionId;
    private String taskCode;
    private TrackingTaskType taskType;
    private String driverName;
    private Instant startTime;
    private Instant endTime;
    private BigDecimal distanceKm;
    private Integer durationMinutes;
}

