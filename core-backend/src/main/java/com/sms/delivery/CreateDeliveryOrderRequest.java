package com.sms.delivery;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CreateDeliveryOrderRequest(
        @NotNull UUID salesOrderId,
        UUID deliveryTripId,
        String destinationAddress,
        String recipientName,
        String recipientPhone,
        Integer stopSequence,
        BigDecimal codAmount,
        String notes,
        @NotEmpty List<UUID> soItemStockUnitIds,
        Double destinationLatitude,
        Double destinationLongitude
) {}
