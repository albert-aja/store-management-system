package com.sms.procurement;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ReceiptItemRequest(
        @NotNull UUID purchaseOrderItemId,
        @Min(0) int acceptedQuantity,
        @Min(0) int rejectedQuantity,
        String rejectedReason,
        String notes
) {}
