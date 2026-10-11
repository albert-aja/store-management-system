package com.sms.inventory;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ReceiveStockUnitRequest(@NotNull UUID productVariantId, @NotNull UUID storeId, String manufacturerSerial, String notes) {
}
