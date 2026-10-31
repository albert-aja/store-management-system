package com.sms.fleet;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.Data;

@Data
public class StartTrackingSessionRequest {
    @NotNull(message = "Employee ID is required")
    private UUID employeeId;

    @NotNull(message = "Task type is required")
    private TrackingTaskType taskType;

    private UUID taskId;
    private String taskCode;
    private UUID vehicleId;
}

