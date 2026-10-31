package com.sms.fleet;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
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
public class UpdateVehicleRequest {

    private UUID storeId;

    @NotNull(message = "Vehicle type is required")
    private VehicleType vehicleType;

    @NotBlank(message = "Brand and model is required")
    private String brandModel;

    private String chassisNumber;
    private String engineNumber;
    private VehicleStatus status;
    private Integer maxPayloadKg;
    private BigDecimal maxVolumeCbm;
    private String fuelType;
    private Integer odometerKm;
    private LocalDate taxDueDate;
    private LocalDate stnkExpiryDate;
    private LocalDate kirExpiryDate;
    private Integer serviceIntervalKm;
    private UUID driverEmployeeId;
}

