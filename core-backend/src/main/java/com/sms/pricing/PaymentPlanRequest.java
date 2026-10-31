package com.sms.pricing;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

public record PaymentPlanRequest(@PositiveOrZero int termMonths, @NotNull @Positive BigDecimal totalPrice) {
}
