package com.sms.procurement;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record PurchaseOrderRequest(@NotNull UUID storeId, @NotNull UUID supplierId, String notes) {
}
