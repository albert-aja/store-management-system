package com.sms.storefront.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record StorefrontOrderDto(
        UUID orderId,
        String orderNumber,
        Instant createdAt,
        String status,
        BigDecimal totalAmount,
        BigDecimal orderDiscountAmount,
        String orderDiscountLabel,
        BigDecimal requiredDepositAmount,
        boolean depositPaid,
        String paymentMethod,
        String fulfillmentPreference,
        String customerName,
        String customerPhone,
        String deliveryAddressSnapshot,
        String customerNotes,
        List<CheckoutResponse.FulfillmentGroupSummaryDto> fulfillmentGroups,
        List<OrderTimelineEventDto> timeline
) {
        public StorefrontOrderDto(UUID orderId, String orderNumber, Instant createdAt, String status,
                        BigDecimal totalAmount, BigDecimal requiredDepositAmount, boolean depositPaid,
                        String paymentMethod, String fulfillmentPreference, String customerName,
                        String customerPhone, String deliveryAddressSnapshot, String customerNotes,
                        List<CheckoutResponse.FulfillmentGroupSummaryDto> fulfillmentGroups,
                        List<OrderTimelineEventDto> timeline) {
                this(orderId, orderNumber, createdAt, status, totalAmount, BigDecimal.ZERO, null,
                                requiredDepositAmount, depositPaid, paymentMethod, fulfillmentPreference,
                                customerName, customerPhone, deliveryAddressSnapshot, customerNotes,
                                fulfillmentGroups, timeline);
        }

    public record OrderTimelineEventDto(
            String milestone,
            String description,
            Instant timestamp,
            boolean completed
    ) {}
}

