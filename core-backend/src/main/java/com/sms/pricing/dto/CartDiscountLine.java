package com.sms.pricing.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record CartDiscountLine(UUID variantId, UUID productId, BigDecimal unitPrice, int quantity) {}