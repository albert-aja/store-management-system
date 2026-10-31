package com.sms.procurement;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public record BulkPurchaseOrderStatusRequest(
        @NotEmpty List<UUID> ids,
        @NotNull String action,
        String reason
) {}
