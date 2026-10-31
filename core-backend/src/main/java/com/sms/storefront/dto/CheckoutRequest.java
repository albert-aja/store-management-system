package com.sms.storefront.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CheckoutRequest(
        @NotBlank String customerName,
        @NotBlank String customerEmail,
        @NotBlank String customerPhone,
        DeliveryAddressDto deliveryAddress,
        String fulfillmentPreference, // COMPLETE or PARTIAL
        String fulfillmentMethod,     // DELIVERY or PICKUP
        UUID pickupStoreId,           // Required if PICKUP
        @NotBlank String paymentMethod, // QRIS, BANK_TRANSFER_VA, COD_DRIVER, etc.
        String customerNotes,
        String orderSource,           // ONLINE_WEB or ONLINE_APP
        @NotEmpty List<CheckoutItemDto> items
) {
    public record DeliveryAddressDto(
            String recipientName,
            String phone,
            String streetAddress,
            String city,
            String province,
            String postalCode
    ) {}

    public record CheckoutItemDto(
            UUID variantId,
            int quantity
    ) {}
}

