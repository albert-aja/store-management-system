package com.sms.procurement;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateReceiptRequest(
        @NotNull UUID purchaseOrderId,
        String notes
) {}
