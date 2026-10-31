package com.sms.inventory;

import java.util.UUID;

public record StockUnitResponse(
        UUID id, UUID productVariantId, String variantName, String manufacturerSerial, UUID currentStoreId,
        StockLocationType locationType, StockAvailability availabilityStatus, UUID reservedForSoItemId, String notes) {

    public static StockUnitResponse from(StockUnit u) {
        return new StockUnitResponse(u.getId(), u.getProductVariant().getId(), u.getProductVariant().getVariantName(),
                u.getManufacturerSerial(), u.getCurrentStore().getId(), u.getLocationType(), u.getAvailabilityStatus(),
                u.getReservedForSoItem() != null ? u.getReservedForSoItem().getId() : null, u.getNotes());
    }
}
