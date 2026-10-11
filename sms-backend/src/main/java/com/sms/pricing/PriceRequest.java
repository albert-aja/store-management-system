package com.sms.pricing;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.UUID;

public record PriceRequest(@NotNull UUID productVariantId, @NotNull @Positive BigDecimal cashPrice) {
}
