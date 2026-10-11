package com.sms.inventory;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record TransferStockUnitRequest(@NotNull UUID toStoreId, @NotNull StockLocationType toLocationType, String notes) {
}
