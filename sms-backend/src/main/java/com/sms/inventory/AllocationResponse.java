package com.sms.inventory;

import java.time.Instant;
import java.util.UUID;

public record AllocationResponse(UUID id, UUID salesOrderItemId, UUID stockUnitId, Instant allocatedAt, Instant releasedAt) {

    public static AllocationResponse from(SalesOrderItemStockUnit a) {
        return new AllocationResponse(a.getId(), a.getSalesOrderItem().getId(), a.getStockUnit().getId(),
                a.getAllocatedAt(), a.getReleasedAt());
    }
}
