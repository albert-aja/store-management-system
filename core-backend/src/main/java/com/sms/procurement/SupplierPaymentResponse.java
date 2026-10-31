package com.sms.procurement;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record SupplierPaymentResponse(
        UUID id,
        UUID purchaseOrderId,
        BigDecimal amount,
        Instant paidAt,
        UUID payerId,
        String notes
) {
    public static SupplierPaymentResponse from(SupplierPayment p) {
        return new SupplierPaymentResponse(
                p.getId(),
                p.getPurchaseOrder().getId(),
                p.getAmount(),
                p.getPaidAt(),
                p.getPayerId(),
                p.getNotes()
        );
    }
}
