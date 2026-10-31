package com.sms.pricing.dto;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.Builder;

@Builder
public record PriceListItemDto(
        UUID variantId,
        String sku,
        String productName,
        String variantName,
        String displayName,
        String categoryName,
        String brandName,
        String specifications,
        BigDecimal hargaDasar,
        BigDecimal downPayment,
        BigDecimal cashPrice,
        BigDecimal installment10,
        BigDecimal installment12,
        BigDecimal installment15
) {}
