package com.sms.procurement;

import java.util.UUID;

public record PurchaseReceiptItemResponse(
        UUID id,
        UUID purchaseOrderItemId,
        String itemName,
        int acceptedQuantity,
        int rejectedQuantity,
        String rejectedReason,
        String notes
) {
    public static PurchaseReceiptItemResponse from(PurchaseReceiptItem item) {
        PurchaseOrderItem poi = item.getPurchaseOrderItem();
        String name = poi.getProductVariant() != null
                ? poi.getProductVariant().getVariantName()
                : poi.getProductComponent().getName();
        return new PurchaseReceiptItemResponse(
                item.getId(),
                poi.getId(),
                name,
                item.getAcceptedQuantity(),
                item.getRejectedQuantity(),
                item.getRejectedReason(),
                item.getNotes()
        );
    }
}
