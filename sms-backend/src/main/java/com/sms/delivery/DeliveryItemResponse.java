package com.sms.delivery;

import com.sms.inventory.SalesOrderItemStockUnit;
import com.sms.inventory.StockUnit;
import com.sms.product.dto.ProductVariant;
import java.util.UUID;

public record DeliveryItemResponse(
        UUID id,
        UUID soItemStockUnitId,
        UUID stockUnitId,
        String manufacturerSerial,
        String productName,
        String variantName,
        String sku,
        String status,
        String rejectionReason,
        String notes
) {
    public static DeliveryItemResponse from(DeliveryItem item) {
        SalesOrderItemStockUnit allocation = item.getSoItemStockUnit();
        StockUnit unit = allocation != null ? allocation.getStockUnit() : null;
        ProductVariant variant = unit != null ? unit.getProductVariant() : null;

        return new DeliveryItemResponse(
                item.getId(),
                allocation != null ? allocation.getId() : null,
                unit != null ? unit.getId() : null,
                unit != null ? unit.getManufacturerSerial() : null,
                variant != null && variant.getProduct() != null ? variant.getProduct().getName() : null,
                variant != null ? variant.getVariantName() : null,
                variant != null ? variant.getSku() : null,
                item.getStatus().name(),
                item.getRejectionReason(),
                item.getNotes()
        );
    }
}
