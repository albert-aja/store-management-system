package com.sms.pricing.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record AutoApplyPricingRequest(
        UUID storeId,
        UUID variantId,
        BigDecimal hargaDasar,
        BigDecimal downPayment,
        BigDecimal cashPrice,
        List<Integer> termMonths
) {}
