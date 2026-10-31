package com.sms.fleet;

import java.math.BigDecimal;
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
public class VehicleServiceLogDto {
    private UUID id;
    private UUID vehicleId;
    private LocalDate serviceDate;
    private String serviceType;
    private Integer odometerKm;
    private String serviceCenter;
    private BigDecimal costAmount;
    private String invoiceNumber;
    private String description;
    private String partsReplaced;
    private Integer nextServiceOdometerKm;
    private UUID performedByEmployeeId;
    private String performedByEmployeeName;
    private Instant createdAt;
}

