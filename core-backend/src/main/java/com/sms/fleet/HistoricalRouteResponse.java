package com.sms.fleet;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoricalRouteResponse {
    private UUID sessionId;
    private UUID employeeId;
    private String employeeName;
    private String employeeRole;
    private TrackingTaskType taskType;
    private String taskCode;
    private String vehicleRegistrationNumber;
    private Instant startTime;
    private Instant endTime;
    private BigDecimal totalDistanceKm;
    private Integer activeDurationMinutes;
    private Integer pausedDurationMinutes;
    private List<LocationPointDto> routePoints;
    private List<SessionEventDto> events;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SessionEventDto {
        private UUID id;
        private TrackingEventType eventType;
        private Instant eventTimestamp;
        private String reasonCode;
        private String notes;
        private BigDecimal latitude;
        private BigDecimal longitude;
    }
}

