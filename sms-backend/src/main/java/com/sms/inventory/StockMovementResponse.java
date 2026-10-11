package com.sms.inventory;

import java.time.Instant;
import java.util.UUID;

public record StockMovementResponse(
        UUID id, MovementType movementType, int quantity, UUID fromStoreId, UUID toStoreId,
        StockLocationType fromLocationType, StockLocationType toLocationType, String referenceType, UUID referenceId,
        String notes, Instant occurredAt) {

    public static StockMovementResponse from(StockMovement m) {
        return new StockMovementResponse(m.getId(), m.getMovementType(), m.getQuantity(),
                m.getFromStore() != null ? m.getFromStore().getId() : null,
                m.getToStore() != null ? m.getToStore().getId() : null,
                m.getFromLocationType(), m.getToLocationType(), m.getReferenceType(), m.getReferenceId(),
                m.getNotes(), m.getOccurredAt());
    }
}
