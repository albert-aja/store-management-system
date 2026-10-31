package com.sms.fleet;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class CreateVehicleMonthlyHealthCheckRequest {

    @NotNull(message = "Check date is required")
    private LocalDate checkDate;

    @NotBlank(message = "Check month (YYYY-MM) is required")
    private String checkMonth;

    private UUID inspectorEmployeeId;
    private String inspectorName;

    @NotBlank(message = "Overall health rating is required")
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
}

