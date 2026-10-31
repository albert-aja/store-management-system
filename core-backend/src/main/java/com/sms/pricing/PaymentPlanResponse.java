package com.sms.pricing;

import java.math.BigDecimal;
import java.util.UUID;

public record PaymentPlanResponse(
        UUID id,
        int termMonths,
        BigDecimal totalPrice,
        BigDecimal monthlyInstallment,
        boolean active
) {
    public static PaymentPlanResponse from(StoreProductPaymentPlan p) {
        BigDecimal monthly = p.getMonthlyInstallment();
        if (monthly == null && p.getTermMonths() > 0 && p.getTotalPrice() != null) {
            monthly = p.getTotalPrice().divide(BigDecimal.valueOf(p.getTermMonths()), 0, java.math.RoundingMode.HALF_UP);
        }
        return new PaymentPlanResponse(p.getId(), p.getTermMonths(), p.getTotalPrice(), monthly, p.isActive());
    }
}
