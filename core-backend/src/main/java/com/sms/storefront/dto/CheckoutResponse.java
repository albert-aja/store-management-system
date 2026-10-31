package com.sms.storefront.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CheckoutResponse(
        UUID orderId,
        String orderNumber,
        String orderStatus,
        BigDecimal totalAmount,
        BigDecimal requiredDepositAmount,
        boolean depositPaid,
        String paymentMethod,
        BigDecimal orderDiscountAmount,
        String orderDiscountLabel,
        PaymentInstructionDto paymentInstructions,
        String fulfillmentPreference,
        List<FulfillmentGroupSummaryDto> fulfillmentGroups
) {
        public CheckoutResponse(UUID orderId, String orderNumber, String orderStatus, BigDecimal totalAmount,
                        BigDecimal requiredDepositAmount, boolean depositPaid, String paymentMethod,
                        PaymentInstructionDto paymentInstructions, String fulfillmentPreference,
                        List<FulfillmentGroupSummaryDto> fulfillmentGroups) {
                this(orderId, orderNumber, orderStatus, totalAmount, requiredDepositAmount, depositPaid,
                                paymentMethod, BigDecimal.ZERO, null, paymentInstructions, fulfillmentPreference, fulfillmentGroups);
        }

    public record PaymentInstructionDto(
            String method,
            String qrCodeString,
            String vaNumber,
            String bankName,
            BigDecimal amountDue,
            Instant expiryTime,
            String instructions
    ) {}

    public record FulfillmentGroupSummaryDto(
            UUID groupId,
            int groupNumber,
            String fulfillmentMethod,
            String status,
            String pickupStoreName,
            Instant estimatedDeliveryDate,
            List<FulfillmentItemDto> items
    ) {}

    public record FulfillmentItemDto(
            String productName,
            String variantName,
            String sku,
            int quantity,
            boolean isProcurementRequired,
            String procurementStatus
    ) {}
}

