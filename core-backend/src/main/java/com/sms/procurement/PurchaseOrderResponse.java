package com.sms.procurement;

import java.time.Instant;
import java.util.UUID;

public record PurchaseOrderResponse(
        UUID id, String number, UUID storeId, UUID supplierId, String supplierName, PurchaseOrderStatus status,
        UUID approvalRequestId, Instant issuedAt, Instant cancelledAt, String cancelReason, String notes) {

    public static PurchaseOrderResponse from(PurchaseOrder po) {
        return new PurchaseOrderResponse(po.getId(), po.getNumber(), po.getStore().getId(), po.getSupplier().getId(),
                po.getSupplier().getName(), po.getStatus(), po.getApprovalRequestId(), po.getIssuedAt(),
                po.getCancelledAt(), po.getCancelReason(), po.getNotes());
    }
}
