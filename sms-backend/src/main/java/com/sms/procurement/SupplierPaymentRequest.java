package com.sms.procurement;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record SupplierPaymentRequest(
        @NotNull UUID purchaseOrderId,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        Instant paidAt,
        String notes
) {}
