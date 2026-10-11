package com.sms.sales;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record SalesOrderRequest(@NotNull UUID storeId, @NotNull UUID customerId, UUID deliveryAddressId) {
}
