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
            String notes,
            Boolean notifyOnPriceDrop,
            BigDecimal alertDropThresholdPercent
    ) {
        public AddToWishlistRequest(UUID productId, UUID variantId, BigDecimal currentPrice, String notes) {
            this(productId, variantId, currentPrice, notes, true, BigDecimal.valueOf(5));
        }
    }

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
            boolean notifyOnPriceDrop,
            BigDecimal alertDropThresholdPercent,
            BigDecimal lastAlertedPrice,
            Instant lastAlertedAt,
            Instant addedAt
    ) {
        public WishlistItemDto(
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
        ) {
            this(
                    id, productId, variantId, productName, variantName, sku, categoryName, brandName,
                    primaryImageUrl, commercialAvailability, leadTimeDays, inStockCount, originalAddedPrice,
                    currentPrice, hasPriceDrop, priceDropAmount, priceDropPercentage, notes,
                    true, BigDecimal.valueOf(5), null, null, addedAt
            );
        }
    }

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

    public record UpdateWishlistAlertSettingsRequest(
            Boolean notifyOnPriceDrop,
            BigDecimal alertDropThresholdPercent
    ) {}

    public record PriceDropAlertSummary(
            UUID alertLogId,
            UUID customerId,
            String customerName,
            String customerEmail,
            String productName,
            BigDecimal originalPrice,
            BigDecimal currentPrice,
            double dropPercentage,
            double thresholdPercentage,
            boolean pushSent,
            boolean emailSent,
            Instant dispatchedAt
    ) {}

    public record PriceDropScanResultDto(
            int scannedCount,
            int alertsTriggered,
            int pushSentCount,
            int emailSentCount,
            List<PriceDropAlertSummary> alerts
    ) {}
}
