package com.sms.inventory;

import java.util.UUID;

public record ComponentStockResponse(UUID id, UUID storeId, UUID productComponentId, String componentName, int quantityOnHand) {

    public static ComponentStockResponse from(ComponentStock c) {
        return new ComponentStockResponse(c.getId(), c.getStore().getId(), c.getProductComponent().getId(),
                c.getProductComponent().getName(), c.getQuantityOnHand());
    }
}
