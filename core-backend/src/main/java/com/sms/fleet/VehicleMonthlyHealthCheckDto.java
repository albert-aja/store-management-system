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
public class VehicleMonthlyHealthCheckDto {
    private UUID id;
    private UUID vehicleId;
    private LocalDate checkDate;
    private String checkMonth;
    private UUID inspectorEmployeeId;
    private String inspectorName;
    private String overallRating; // HEALTHY, ATTENTION_NEEDED, UNFIT_FOR_ROAD
    private String engineOilStatus;
    private String radiatorCoolantStatus;
    private String brakeFluidStatus;
    private String brakeCondition;
    private String frontTireCondition;
    private String rearTireCondition;
    private Integer tirePressurePsi;
    private String batteryCondition;
    private String headlampsAndSignalsStatus;
    private String hornAndWipersStatus;
    private Boolean safetyEquipmentPresent;
    private LocalDate aparExpiryDate;
    private String cargoBoxCondition;
    private Integer odometerReadingKm;
    private String notes;
    private String actionRequired;
    private LocalDate nextCheckDueDate;
    private Instant createdAt;
}

