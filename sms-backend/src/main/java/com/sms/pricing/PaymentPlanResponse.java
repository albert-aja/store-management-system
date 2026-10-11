package com.sms.pricing;

import java.math.BigDecimal;
import java.util.UUID;

public record PaymentPlanResponse(UUID id, int termMonths, BigDecimal totalPrice, boolean active) {

    public static PaymentPlanResponse from(StoreProductPaymentPlan p) {
        return new PaymentPlanResponse(p.getId(), p.getTermMonths(), p.getTotalPrice(), p.isActive());
    }
}
