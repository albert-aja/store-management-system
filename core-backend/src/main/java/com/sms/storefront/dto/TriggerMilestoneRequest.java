package com.sms.storefront.dto;

import java.util.Map;

public record TriggerMilestoneRequest(
    String orderNumber,
    String milestoneType, // DEPOSIT_CONFIRMED, PO_PLACED, DRIVER_EN_ROUTE, STORE_PICKUP_READY
    String customTitle,
    String customBody,
    Map<String, Object> metadata
) {}

