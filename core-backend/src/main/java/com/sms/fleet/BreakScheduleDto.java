package com.sms.fleet;

import java.time.LocalTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BreakScheduleDto {
    private UUID id;
    private UUID storeId;
    private String name;
    private String employeeRole;
    private LocalTime startTime;
    private LocalTime endTime;
    private boolean active;
}

