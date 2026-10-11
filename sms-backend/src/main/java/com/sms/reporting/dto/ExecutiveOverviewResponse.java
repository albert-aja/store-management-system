package com.sms.reporting.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ExecutiveOverviewResponse {
    private BigDecimal totalSalesAmount;
    private long totalOrdersCount;
    private BigDecimal totalCashCollected;
    private BigDecimal totalOutstandingReceivables;
    private BigDecimal overdueReceivablesAmount;
    private long activeCreditAccountsCount;
    private long totalStockUnitsCount;
    private long warehouseUnitsCount;
    private long showroomUnitsCount;
    private long repairUnitsCount;
    private BigDecimal totalExpensesAmount;
    private long totalOverrunExpensesCount;
}
