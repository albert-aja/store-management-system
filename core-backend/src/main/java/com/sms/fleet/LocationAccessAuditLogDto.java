package com.sms.fleet;

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
public class LocationAccessAuditLogDto {
    private UUID id;
    private UUID actorEmployeeId;
    private String actorEmployeeName;
    private UUID targetEmployeeId;
    private String targetEmployeeName;
    private LocationAccessQueryType queryType;
    private Instant timestamp;
    private String ipAddress;
    private String userAgent;
    private String details;
}

