package com.sms.product;

import com.sms.product.dto.ProductComponent;

import java.util.UUID;

public record ComponentResponse(UUID id, String name, int quantity, String notes, boolean active) {

    public static ComponentResponse from(ProductComponent c) {
        return new ComponentResponse(c.getId(), c.getName(), c.getQuantity(), c.getNotes(), c.isActive());
    }
}
