package com.sms.sales;

import java.math.BigDecimal;
import java.util.UUID;

public record ConfirmSalesOrderRequest(
        boolean dpReceived,
        BigDecimal dpAmount,
        String paymentMethod,
        UUID collectorEmployeeId,
        String notes
) {
    public ConfirmSalesOrderRequest(boolean dpReceived) {
        this(dpReceived, null, null, null, null);
    }
}
