package com.sms.inventory;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AllocateRequest(@NotNull UUID stockUnitId) {
}
