package com.sms.inventory;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateStocktakeSessionRequest(@NotNull UUID storeId) {
}
