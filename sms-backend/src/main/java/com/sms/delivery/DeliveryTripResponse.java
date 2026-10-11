package com.sms.delivery;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record DeliveryTripResponse(
        UUID id,
        String tripNumber,
        UUID storeId,
        String storeName,
        UUID driverEmployeeId,
        String driverName,
        UUID helperEmployeeId,
        String helperName,
        String vehiclePlate,
        LocalDate scheduledDate,
        String status,
        Instant departedAt,
        Instant completedAt,
        String notes,
        Instant createdAt
) {
    public static DeliveryTripResponse from(DeliveryTrip t) {
        return new DeliveryTripResponse(
                t.getId(),
                t.getTripNumber(),
                t.getStore() != null ? t.getStore().getId() : null,
                t.getStore() != null ? t.getStore().getName() : null,
                t.getDriver() != null ? t.getDriver().getId() : null,
                t.getDriver() != null ? t.getDriver().getFullName() : null,
                t.getHelper() != null ? t.getHelper().getId() : null,
                t.getHelper() != null ? t.getHelper().getFullName() : null,
                t.getVehiclePlate(),
                t.getScheduledDate(),
                t.getStatus().name(),
                t.getDepartedAt(),
                t.getCompletedAt(),
                t.getNotes(),
                t.getCreatedAt()
        );
    }
}
