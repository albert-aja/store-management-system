package com.sms.delivery;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class DeliveryRescheduleDto {
    private DeliveryRescheduleDto() {}

    public record Submit(
            @NotNull LocalDate requestedDate, @NotNull DeliveryWindow requestedWindow,
            @Size(max = 300) String reason) {}

    public record Approve(@NotNull UUID targetTripId, @Size(max = 300) String notes) {}
    public record Reject(@NotBlank @Size(max = 300) String notes) {}
    public record Schedule(@NotNull Instant plannedDispatchAt) {}

    public record Request(
            UUID id, UUID deliveryOrderId, String deliveryOrderNumber, UUID salesOrderId,
            UUID storeId, LocalDate requestedDate, DeliveryWindow requestedWindow,
            String reason, DeliveryRescheduleRequest.Status status,
            Instant createdAt, Instant decidedAt, String decisionNotes, UUID assignedTripId) {
        public static Request from(DeliveryRescheduleRequest request) {
            DeliveryOrder order = request.getDeliveryOrder();
            return new Request(request.getId(), order.getId(), order.getDeliveryOrderNumber(),
                    order.getSalesOrder().getId(), order.getSalesOrder().getStore().getId(),
                    request.getRequestedDate(), request.getRequestedWindow(), request.getReason(),
                    request.getStatus(), request.getCreatedAt(), request.getDecidedAt(),
                    request.getDecisionNotes(),
                    request.getAssignedTrip() == null ? null : request.getAssignedTrip().getId());
        }
    }

    public record Stop(
            UUID deliveryOrderId, String deliveryOrderNumber,
            Instant plannedDispatchAt, LocalDate deliveryDate, DeliveryWindow deliveryWindow,
            boolean eligible, String unavailableReason, List<Request> requests) {}
}
