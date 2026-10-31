package com.sms.sales;

import java.time.Instant;
import java.util.UUID;

public record SalesOrderResponse(
        UUID id, String number, UUID storeId, UUID customerId, String customerName, UUID salespersonEmployeeId,
        UUID deliveryAddressId, String deliveryAddressSnapshot, SalesOrderStatus status,
        boolean requiresPriceApproval, UUID approvalRequestId, Instant releasedAt, Instant cancelledAt, String cancelReason) {

    public static SalesOrderResponse from(SalesOrder so) {
        return new SalesOrderResponse(so.getId(), so.getNumber(), so.getStore().getId(), so.getCustomer().getId(),
                so.getCustomer().getFullName(), so.getSalesperson().getId(),
                so.getDeliveryAddress() != null ? so.getDeliveryAddress().getId() : null, so.getDeliveryAddressSnapshot(),
                so.getStatus(), so.isRequiresPriceApproval(), so.getApprovalRequestId(), so.getReleasedAt(),
                so.getCancelledAt(), so.getCancelReason());
    }
}
