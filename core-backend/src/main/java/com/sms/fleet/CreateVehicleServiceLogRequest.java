package com.sms.fleet;

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
public class CreateVehicleServiceLogRequest {

    @NotNull(message = "Service date is required")
    private LocalDate serviceDate;

    @NotNull(message = "Service type is required")
    private String serviceType;

    @NotNull(message = "Odometer reading is required")
    private Integer odometerKm;

    private String serviceCenter;
    private BigDecimal costAmount;
    private String invoiceNumber;
    private String description;
    private String partsReplaced;
    private Integer nextServiceOdometerKm;
    private UUID performedByEmployeeId;
}

