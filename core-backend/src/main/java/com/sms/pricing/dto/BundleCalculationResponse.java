package com.sms.pricing.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record BundleCalculationResponse(
        BigDecimal totalHargaDasar,
        BigDecimal bundleDiscount,
        BigDecimal netHargaDasar,
        BigDecimal downPayment,
        boolean autoDpApplied,
        List<BundleItemDto> items,
        List<CalculatedTermItem> terms,
        Map<Integer, BigDecimal> separateTotalInstallments,
        Map<Integer, BigDecimal> monthlySavings
) {}

