package com.sms.fleet;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class VehicleFuelLogDto {

    public record Response(
            UUID id,
            UUID vehicleId,
            String registrationNumber,
            UUID driverEmployeeId,
            String driverName,
            LocalDate logDate,
            Integer odometerKm,
            BigDecimal fuelLiters,
            BigDecimal costPerLiter,
            BigDecimal totalCost,
            String fuelType,
            String gasStationName,
            boolean fullTank,
            BigDecimal efficiencyKmPerLiter,
            String receiptPhotoUrl,
            String invoiceNumber,
            String notes,
            Instant createdAt
    ) {}

    public record CreateRequest(
            @NotNull LocalDate logDate,
            UUID driverEmployeeId,
            @NotNull Integer odometerKm,
            @NotNull BigDecimal fuelLiters,
            @NotNull BigDecimal costPerLiter,
            BigDecimal totalCost,
            String fuelType,
            String gasStationName,
            Boolean fullTank,
            String receiptPhotoUrl,
            String invoiceNumber,
            String notes
    ) {}
}

