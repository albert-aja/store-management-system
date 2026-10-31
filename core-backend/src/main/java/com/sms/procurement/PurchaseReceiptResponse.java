package com.sms.procurement;

import java.time.Instant;
import java.util.UUID;

public record PurchaseReceiptResponse(
        UUID id,
        UUID purchaseOrderId,
        String status,
        Instant receivedAt,
        String notes
) {
    public static PurchaseReceiptResponse from(PurchaseReceipt r) {
        return new PurchaseReceiptResponse(
                r.getId(),
                r.getPurchaseOrder().getId(),
                r.getStatus().name(),
                r.getReceivedAt(),
                r.getNotes()
        );
    }
}
