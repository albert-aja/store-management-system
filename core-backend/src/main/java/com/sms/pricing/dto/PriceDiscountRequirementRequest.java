package com.sms.pricing.dto;

import java.util.UUID;

public record PriceDiscountRequirementRequest(UUID productVariantId, int quantity) {}