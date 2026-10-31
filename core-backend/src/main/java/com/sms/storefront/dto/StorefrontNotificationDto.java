package com.sms.storefront.dto;

import java.time.Instant;

public record StorefrontNotificationDto(
    String id,
    String customerId,
    String orderNumber,
    String milestoneType,
    String title,
    String body,
    String payloadData,
    String status,
    boolean isRead,
    Instant sentAt
) {}

