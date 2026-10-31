package com.sms.sales;

/** Delivery/Finance modules extend this lifecycle further (Fulfillment/Delivered/Completed) when built. */
public enum SalesOrderStatus {
    DRAFT,
    PENDING_PRICE_APPROVAL,
    REJECTED,
    RELEASED,
    SURVEY_REJECTED,
    CONFIRMED,
    COMPLETED,
    CANCELLED
}
