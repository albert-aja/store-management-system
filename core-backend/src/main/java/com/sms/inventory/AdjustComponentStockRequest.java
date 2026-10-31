package com.sms.inventory;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AdjustComponentStockRequest(@NotNull UUID productComponentId, int delta, String notes) {

    public AdjustComponentStockRequest {
        if (delta == 0) {
            throw new IllegalArgumentException("delta must not be zero");
        }
    }
}
