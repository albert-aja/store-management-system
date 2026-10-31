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
public class LiveFleetStatusDto {
    private UUID employeeId;
    private String employeeName;
    private String employeeRole;
    private UUID sessionId;
    private TrackingSessionStatus trackingStatus;
    private TrackingTaskType taskType;
    private String taskCode;
    private UUID vehicleId;
    private String vehicleRegistrationNumber;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal accuracyMeters;
    private BigDecimal speedKmh;
    private BigDecimal headingDegrees;
    private Integer batteryLevelPct;
    private Instant lastPingAt;
}

