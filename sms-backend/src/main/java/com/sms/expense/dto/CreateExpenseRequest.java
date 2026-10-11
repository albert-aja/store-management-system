package com.sms.expense.dto;

import com.sms.expense.ExpenseActivityType;
import com.sms.expense.ExpensePaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateExpenseRequest {
    @NotNull
    private UUID storeId;

    @NotNull
    private UUID expenseCategoryId;

    private UUID budgetRequestId;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal amount;

    @NotNull
    private LocalDate expenseDate;

    @NotNull
    private ExpensePaymentMethod paymentMethod = ExpensePaymentMethod.CASH_PETTY;

    private String payeeName;

    @NotBlank
    private String description;

    private String receiptUrl;

    @NotNull
    private UUID createdById;

    private ExpenseActivityType activityType;
    private UUID referenceId;
    private String notes;
}
