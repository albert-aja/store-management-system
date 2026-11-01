package com.sms.pricing.dto;

import java.math.BigDecimal;
import java.util.List;

public record BundleCalculationRequest(
        List<BundleItemDto> items,
        BigDecimal discountPercent,
        BigDecimal discountAmount,
        BigDecimal downPayment,
        List<Integer> termMonths
) {}

