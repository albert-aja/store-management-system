package com.sms.pricing.dto;

import java.math.BigDecimal;
import java.util.List;

public record PriceCalculationResponse(
        BigDecimal hargaDasar,
        BigDecimal downPayment,
        boolean autoDpApplied,
        List<CalculatedTermItem> terms
) {}
