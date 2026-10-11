package com.sms.delivery;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record DeliveryOrderResponse(
        UUID id,
        String deliveryOrderNumber,
        UUID salesOrderId,
        String salesOrderNumber,
        UUID deliveryTripId,
        String tripNumber,
        String destinationAddress,
        String recipientName,
        String recipientPhone,
        int stopSequence,
        String status,
        boolean preInspectionPassed,
        String preInspectionNotes,
        Instant deliveredAt,
        String signedBy,
        String proofPhotoUrl,
        String failureReason,
        BigDecimal codAmount,
        BigDecimal codCollected,
        String codNotes,
        String notes,
        Instant createdAt,
        List<DeliveryItemResponse> items
) {
    public static DeliveryOrderResponse from(DeliveryOrder o) {
        List<DeliveryItemResponse> itemResponses = o.getItems() != null
                ? o.getItems().stream().map(DeliveryItemResponse::from).toList()
                : List.of();

        return new DeliveryOrderResponse(
                o.getId(),
                o.getDeliveryOrderNumber(),
                o.getSalesOrder() != null ? o.getSalesOrder().getId() : null,
                o.getSalesOrder() != null ? o.getSalesOrder().getNumber() : null,
                o.getDeliveryTrip() != null ? o.getDeliveryTrip().getId() : null,
                o.getDeliveryTrip() != null ? o.getDeliveryTrip().getTripNumber() : null,
                o.getDestinationAddress(),
                o.getRecipientName(),
                o.getRecipientPhone(),
                o.getStopSequence(),
                o.getStatus().name(),
                o.isPreInspectionPassed(),
                o.getPreInspectionNotes(),
                o.getDeliveredAt(),
                o.getSignedBy(),
                o.getProofPhotoUrl(),
                o.getFailureReason(),
                o.getCodAmount(),
                o.getCodCollected(),
                o.getCodNotes(),
                o.getNotes(),
                o.getCreatedAt(),
                itemResponses
        );
    }
}
