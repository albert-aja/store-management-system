package com.sms.fleet;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalTime;
import java.util.UUID;
import lombok.Data;

@Data
public class CreateBreakScheduleRequest {
    private UUID storeId;

    @NotBlank(message = "Break name is required")
    private String name;

    private String employeeRole;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;
}

