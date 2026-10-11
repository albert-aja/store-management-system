package com.sms.expense.dto;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BudgetConsumptionResponse {
    private UUID categoryId;
    private String categoryCode;
    private String categoryName;
    private int periodMonth;
    private int periodYear;
    private BigDecimal allocatedBudget;
    private BigDecimal totalSpent;
    private BigDecimal remainingBudget;
    private boolean overrun;
    private double consumptionPercent;
}
