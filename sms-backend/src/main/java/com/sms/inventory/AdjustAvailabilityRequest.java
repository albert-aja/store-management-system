package com.sms.inventory;

import jakarta.validation.constraints.NotNull;

public record AdjustAvailabilityRequest(@NotNull StockAvailability status, String reason) {
}
