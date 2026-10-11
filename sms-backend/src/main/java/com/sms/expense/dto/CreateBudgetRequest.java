package com.sms.expense.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateBudgetRequest {
    @NotNull
    private UUID storeId;

    @NotNull
    private UUID expenseCategoryId;

    @Min(1)
    @Max(12)
    private int periodMonth;

    @Min(2020)
    private int periodYear;

    @NotNull
    @DecimalMin("0.00")
    private BigDecimal requestedAmount;

    @NotNull
    private UUID requestedById;

    private String justification;
    private String notes;
}
