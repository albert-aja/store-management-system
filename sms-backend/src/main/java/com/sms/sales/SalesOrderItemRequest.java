package com.sms.sales;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.util.UUID;

public record SalesOrderItemRequest(
        @NotNull UUID productVariantId,
        @Positive int quantity,
        @PositiveOrZero int paymentTermMonths,
        @NotNull @Positive BigDecimal finalPrice) {
}
