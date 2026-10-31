package com.sms.reporting.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class InventoryDistributionResponse {
    private long totalUnits;
    private long warehouseUnits;
    private long showroomUnits;
    private long repairAreaUnits;
    private long inTransitUnits;
    private long atCustomerUnits;
    private long availableUnits;
    private long reservedUnits;
    private long unavailableUnits;
}
