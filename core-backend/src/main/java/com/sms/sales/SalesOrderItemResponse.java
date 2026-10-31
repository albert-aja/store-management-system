package com.sms.sales;

import java.math.BigDecimal;
import java.util.UUID;

public record SalesOrderItemResponse(
        UUID id, UUID productVariantId, String variantName, int quantity, int paymentTermMonths,
        BigDecimal referencePrice, BigDecimal finalPrice, String notes) {

    public static SalesOrderItemResponse from(SalesOrderItem i) {
        return new SalesOrderItemResponse(i.getId(), i.getProductVariant().getId(), i.getProductVariant().getVariantName(),
                i.getQuantity(), i.getPaymentTermMonths(), i.getReferencePrice(), i.getFinalPrice(), i.getNotes());
    }
}
