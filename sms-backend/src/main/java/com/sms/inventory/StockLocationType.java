package com.sms.inventory;

/** No shelf/rack/bin tracking (README 6.3); external states apply once Transfer/Delivery/Repair modules move units. */
public enum StockLocationType {
    WAREHOUSE,
    SHOWROOM,
    REPAIR_AREA,
    IN_TRANSIT,
    AT_CUSTOMER,
    AT_SUPPLIER,
    AT_REPAIR_PROVIDER,
    DISPOSED
}
