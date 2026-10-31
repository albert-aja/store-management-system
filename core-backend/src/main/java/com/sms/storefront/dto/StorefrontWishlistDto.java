package com.sms.storefront.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class StorefrontWishlistDto {

    public record AddToWishlistRequest(
            UUID productId,
            UUID variantId,
            BigDecimal currentPrice,
            String notes
    ) {}

    public record WishlistItemDto(
            UUID id,
            UUID productId,
            UUID variantId,
            String productName,
            String variantName,
            String sku,
            String categoryName,
            String brandName,
            String primaryImageUrl,
            String commercialAvailability,
            int leadTimeDays,
            long inStockCount,
            BigDecimal originalAddedPrice,
            BigDecimal currentPrice,
            boolean hasPriceDrop,
            BigDecimal priceDropAmount,
            double priceDropPercentage,
            String notes,
            Instant addedAt
    ) {}

    public record WishlistSummaryDto(
            List<WishlistItemDto> items,
            int totalItems,
            int priceDropCount,
            BigDecimal totalPotentialSavings
    ) {}

    public record SyncWishlistRequest(
            String guestSessionId,
            UUID customerId
    ) {}

    public record CheckWishlistResponse(
            boolean wishlisted,
            UUID itemId
    ) {}

    public record PriceDropSimulationRequest(
            BigDecimal newPrice
    ) {}
}
