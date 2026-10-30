package com.sms.customer.crm.dto;

import java.math.BigDecimal;

public record VoucherValidationResponse(
        boolean valid,
        String message,
        String code,
        BigDecimal discountAmount,
        BigDecimal finalAmount
) {}

