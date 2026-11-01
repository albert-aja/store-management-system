package com.sms.fleet;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class VehicleMaintenanceScheduleDto {

    public record Response(
            UUID id,
            UUID vehicleId,
            String registrationNumber,
            LocalDate scheduledDate,
            String maintenanceType,
            Integer targetOdometerKm,
            BigDecimal estimatedCost,
            BigDecimal actualCost,
            String serviceCenter,
            String status,
            Instant completedAt,
            String notes,
            boolean isDueOrOverdue,
            Instant createdAt
    ) {}

    public record CreateRequest(
            @NotNull LocalDate scheduledDate,
            @NotBlank String maintenanceType,
            Integer targetOdometerKm,
            BigDecimal estimatedCost,
            String serviceCenter,
            String notes
    ) {}

    public record UpdateStatusRequest(
            @NotBlank String status,
            BigDecimal actualCost,
            String notes
    ) {}
}

