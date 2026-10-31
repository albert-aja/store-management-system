package com.sms.fleet;

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
public class VehicleDto {
    private UUID id;
    private UUID storeId;
    private String storeName;
    private String registrationNumber;
    private VehicleType vehicleType;
    private String brandModel;
    private String chassisNumber;
    private String engineNumber;
    private VehicleStatus status;
    private Integer maxPayloadKg;
    private BigDecimal maxVolumeCbm;
    private String fuelType;
    private Integer odometerKm;
    private LocalDate stnkExpiryDate;
    private LocalDate kirExpiryDate;
    private Integer lastServiceOdometerKm;
    private LocalDate lastServiceDate;
    private Integer serviceIntervalKm;
    private Boolean isServiceDue;
    private Long stnkDaysRemaining;
    private Long kirDaysRemaining;
}

