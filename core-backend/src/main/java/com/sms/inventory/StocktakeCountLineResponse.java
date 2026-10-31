package com.sms.inventory;

import java.util.UUID;

public record StocktakeCountLineResponse(
        UUID id,
        UUID stockUnitId,
        UUID productVariantId,
        String scanCode,
        String variantName,
        boolean expected,
        boolean counted,
        StocktakeVariance variance) {

    public static StocktakeCountLineResponse from(StocktakeCountLine line) {
        return new StocktakeCountLineResponse(
                line.getId(),
                line.getStockUnit() != null ? line.getStockUnit().getId() : null,
                line.getProductVariant() != null ? line.getProductVariant().getId() : null,
                line.getScanCode(),
                line.getVariantName(),
                line.isExpected(),
                line.isCounted(),
                line.getVariance());
    }
}
