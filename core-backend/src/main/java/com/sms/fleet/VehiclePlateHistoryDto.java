package com.sms.fleet;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehiclePlateHistoryDto {
    private UUID id;
    private UUID vehicleId;
    private String oldRegistrationNumber;
    private String newRegistrationNumber;
    private LocalDate changeDate;
    private String reason;
    private String notes;
    private UUID changedByEmployeeId;
    private String changedByEmployeeName;
    private Instant createdAt;
}

