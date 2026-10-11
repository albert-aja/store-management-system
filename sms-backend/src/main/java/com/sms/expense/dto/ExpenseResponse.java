package com.sms.expense.dto;

import com.sms.expense.Expense;
import com.sms.expense.ExpenseActivityType;
import com.sms.expense.ExpensePaymentMethod;
import com.sms.expense.ExpenseStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ExpenseResponse {
    private UUID id;
    private String expenseNumber;
    private UUID storeId;
    private String storeName;
    private UUID expenseCategoryId;
    private String expenseCategoryCode;
    private String expenseCategoryName;
    private UUID budgetRequestId;
    private BigDecimal amount;
    private LocalDate expenseDate;
    private ExpensePaymentMethod paymentMethod;
    private String payeeName;
    private String description;
    private String receiptUrl;
    private boolean overrun;
    private ExpenseStatus status;
    private UUID createdById;
    private String createdByName;
    private UUID approvedById;
    private String approvedByName;
    private ExpenseActivityType activityType;
    private UUID referenceId;
    private String notes;
    private Instant createdAt;

    public static ExpenseResponse from(Expense e) {
        return ExpenseResponse.builder()
                .id(e.getId())
                .expenseNumber(e.getExpenseNumber())
                .storeId(e.getStore().getId())
                .storeName(e.getStore().getName())
                .expenseCategoryId(e.getExpenseCategory().getId())
                .expenseCategoryCode(e.getExpenseCategory().getCode())
                .expenseCategoryName(e.getExpenseCategory().getName())
                .budgetRequestId(e.getBudgetRequest() != null ? e.getBudgetRequest().getId() : null)
                .amount(e.getAmount())
                .expenseDate(e.getExpenseDate())
                .paymentMethod(e.getPaymentMethod())
                .payeeName(e.getPayeeName())
                .description(e.getDescription())
                .receiptUrl(e.getReceiptUrl())
                .overrun(e.isOverrun())
                .status(e.getStatus())
                .createdById(e.getSubmittedBy() != null ? e.getSubmittedBy().getId() : null)
                .createdByName(e.getSubmittedBy() != null ? e.getSubmittedBy().getFullName() : null)
                .approvedById(e.getApprovedBy() != null ? e.getApprovedBy().getId() : null)
                .approvedByName(e.getApprovedBy() != null ? e.getApprovedBy().getFullName() : null)
                .activityType(e.getActivityType())
                .referenceId(e.getReferenceId())
                .notes(e.getNotes())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
