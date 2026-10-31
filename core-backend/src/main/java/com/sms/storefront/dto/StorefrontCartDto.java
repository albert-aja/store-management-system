package com.sms.storefront.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record StorefrontCartDto(
        UUID cartId,
        List<CartItemDto> items,
        int totalItemCount,
        BigDecimal subtotalAmount,
        BigDecimal totalDiscountAmount,
        BigDecimal estimatedTax,
        BigDecimal totalAmount,
        BigDecimal orderDiscountAmount,
        String orderDiscountLabel
) {
    public StorefrontCartDto(
            UUID cartId,
            List<CartItemDto> items,
            int totalItemCount,
            BigDecimal subtotalAmount,
            BigDecimal estimatedTax,
            BigDecimal totalAmount
    ) {
        this(cartId, items, totalItemCount, subtotalAmount, BigDecimal.ZERO, estimatedTax, totalAmount, BigDecimal.ZERO, null);
        }

        public StorefrontCartDto(UUID cartId, List<CartItemDto> items, int totalItemCount,
            BigDecimal subtotalAmount, BigDecimal totalDiscountAmount, BigDecimal estimatedTax,
            BigDecimal totalAmount) {
        this(cartId, items, totalItemCount, subtotalAmount, totalDiscountAmount, estimatedTax,
            totalAmount, BigDecimal.ZERO, null);
    }

    public record CartItemDto(
            UUID itemId,
            UUID variantId,
            String productName,
            String variantName,
            String sku,
            BigDecimal unitPrice,
            BigDecimal originalUnitPrice,
            BigDecimal discountAmount,
            boolean hasDiscount,
            String discountLabel,
            int quantity,
            BigDecimal subtotal,
            String imageUrl,
            String commercialAvailability
    ) {
        public CartItemDto(
                UUID itemId,
                UUID variantId,
                String productName,
                String variantName,
                String sku,
                BigDecimal unitPrice,
                int quantity,
                BigDecimal subtotal,
                String imageUrl,
                String commercialAvailability
        ) {
            this(itemId, variantId, productName, variantName, sku, unitPrice, unitPrice, BigDecimal.ZERO, false, null, quantity, subtotal, imageUrl, commercialAvailability);
        }
    }
}
