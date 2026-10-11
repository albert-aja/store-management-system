package com.sms.reporting.dto;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SalesPerformanceItem {
    private UUID salespersonId;
    private String salespersonName;
    private String salespersonCode;
    private long confirmedOrdersCount;
    private BigDecimal totalSalesVolume;
    private BigDecimal estimatedCommission;
}
