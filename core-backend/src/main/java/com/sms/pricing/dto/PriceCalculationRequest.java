package com.sms.pricing.dto;

import java.math.BigDecimal;
import java.util.List;

public record PriceCalculationRequest(
        BigDecimal hargaDasar,
        BigDecimal downPayment,
        List<Integer> termMonths
) {}
