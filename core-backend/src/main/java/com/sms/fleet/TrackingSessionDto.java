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
public class TrackingSessionDto {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private String employeeRole;
    private TrackingTaskType taskType;
    private UUID taskId;
    private String taskCode;
    private UUID vehicleId;
    private String vehicleRegistrationNumber;
    private TrackingSessionStatus status;
    private Instant startTime;
    private Instant endTime;
    private BigDecimal totalDistanceMeters;
    private Integer activeDurationSeconds;
    private Integer pausedDurationSeconds;
}

