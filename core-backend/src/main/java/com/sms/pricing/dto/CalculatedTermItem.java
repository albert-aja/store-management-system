package com.sms.pricing.dto;

import java.math.BigDecimal;

public record CalculatedTermItem(
        int termMonths,
        BigDecimal monthlyInstallment,
        BigDecimal totalPrice
) {}
