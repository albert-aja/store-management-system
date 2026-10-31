package com.sms.procurement;

import java.math.BigDecimal;
import java.util.UUID;

public record PurchaseOrderItemResponse(
        UUID id, UUID productVariantId, UUID productComponentId, String itemName, int quantity,
        BigDecimal unitCost, BigDecimal lineTotal, String notes) {

    public static PurchaseOrderItemResponse from(PurchaseOrderItem i) {
        String name = i.getProductVariant() != null
                ? i.getProductVariant().getVariantName()
                : i.getProductComponent().getName();
        return new PurchaseOrderItemResponse(i.getId(),
                i.getProductVariant() != null ? i.getProductVariant().getId() : null,
                i.getProductComponent() != null ? i.getProductComponent().getId() : null,
                name, i.getQuantity(), i.getUnitCost(),
                i.getUnitCost().multiply(BigDecimal.valueOf(i.getQuantity())), i.getNotes());
    }
}
