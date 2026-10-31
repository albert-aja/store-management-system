package com.sms.pricing.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record CartDiscountResult(UUID discountId, String discountName, BigDecimal discountAmount) {
    public static CartDiscountResult none() {
        return new CartDiscountResult(null, null, BigDecimal.ZERO);
    }
}