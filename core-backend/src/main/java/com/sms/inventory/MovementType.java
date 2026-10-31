package com.sms.inventory;

/** Only RECEIVING/TRANSFER/ADJUSTMENT (+ component equivalents) are posted today; other types are declared
 *  for forward-compatibility but implemented when Procurement/Delivery/Repair/Warranty/Repossession modules land. */
public enum MovementType {
    RECEIVING,
    TRANSFER,
    ADJUSTMENT,
    DELIVERY,
    REPOSSESSION_IN,
    CUSTOMER_RETURN,
    DISPOSAL,
    REPAIR_OUT,
    REPAIR_IN,
    COMPONENT_RECEIVING,
    COMPONENT_CONSUMPTION,
    COMPONENT_ADJUSTMENT
}
