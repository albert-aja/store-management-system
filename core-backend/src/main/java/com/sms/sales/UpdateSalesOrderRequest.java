package com.sms.sales;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record UpdateSalesOrderRequest(@NotNull UUID customerId, UUID deliveryAddressId) {
}
