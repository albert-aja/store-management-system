package com.sms.product;

import com.sms.product.dto.Product;
import java.util.UUID;

public record ProductResponse(
        UUID id, String code, String name, UUID categoryId, String categoryName, UUID brandId, String brandName,
        String description, boolean active) {

    public static ProductResponse from(Product p) {
        return new ProductResponse(p.getId(), p.getCode(), p.getName(),
                p.getCategory() != null ? p.getCategory().getId() : null,
                p.getCategory() != null ? p.getCategory().getName() : null,
                p.getBrand() != null ? p.getBrand().getId() : null,
                p.getBrand() != null ? p.getBrand().getName() : null,
                p.getDescription(), p.isActive());
    }
}
