package com.sms.procurement;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

/** Exactly one of productVariantId / productComponentId must be provided (validated in the service). */
public record PurchaseOrderItemRequest(
        UUID productVariantId, UUID productComponentId, @Min(1) int quantity,
        @NotNull @DecimalMin("0.00") BigDecimal unitCost, String notes) {
}
