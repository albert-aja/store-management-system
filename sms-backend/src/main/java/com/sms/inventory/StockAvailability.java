package com.sms.inventory;

/** Only these three states exist (README core-concepts table); "allocated" stays Reserved until Delivery module exists. */
public enum StockAvailability {
    AVAILABLE,
    RESERVED,
    UNAVAILABLE
}
