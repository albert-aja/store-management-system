package com.sms.fleet;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Data;

@Data
public class CreateVehicleRequest {
    private UUID storeId;

    @NotBlank(message = "Registration number (license plate) is required")
    private String registrationNumber;

    @NotNull(message = "Vehicle type is required")
    private VehicleType vehicleType;

    @NotBlank(message = "Brand and model is required")
    private String brandModel;

    private String chassisNumber;
    private String engineNumber;
    private Integer maxPayloadKg;
    private BigDecimal maxVolumeCbm;
    private String fuelType;
    private Integer odometerKm;
    private LocalDate stnkExpiryDate;
    private LocalDate kirExpiryDate;
    private Integer lastServiceOdometerKm;
    private LocalDate lastServiceDate;
    private Integer serviceIntervalKm;
}

