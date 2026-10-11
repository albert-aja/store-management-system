package com.sms.delivery;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public record CreateDeliveryTripRequest(
        @NotNull UUID storeId,
        @NotNull UUID driverEmployeeId,
        UUID helperEmployeeId,
        String vehiclePlate,
        LocalDate scheduledDate,
        String notes
) {}
