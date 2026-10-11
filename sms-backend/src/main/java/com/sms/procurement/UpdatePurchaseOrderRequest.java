package com.sms.procurement;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record UpdatePurchaseOrderRequest(@NotNull UUID supplierId, String notes) {
}
