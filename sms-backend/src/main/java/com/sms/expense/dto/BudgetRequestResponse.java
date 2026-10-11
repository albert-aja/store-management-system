package com.sms.expense.dto;

import com.sms.expense.BudgetRequest;
import com.sms.expense.BudgetRequestStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BudgetRequestResponse {
    private UUID id;
    private String requestNumber;
    private UUID storeId;
    private String storeName;
    private UUID expenseCategoryId;
    private String expenseCategoryCode;
    private String expenseCategoryName;
    private int periodMonth;
    private int periodYear;
    private BigDecimal requestedAmount;
    private BigDecimal approvedAmount;
    private BudgetRequestStatus status;
    private UUID requestedById;
    private String requestedByName;
    private UUID approvedById;
    private String approvedByName;
    private String justification;
    private String notes;
    private Instant createdAt;

    public static BudgetRequestResponse from(BudgetRequest b) {
        return BudgetRequestResponse.builder()
                .id(b.getId())
                .requestNumber(b.getRequestNumber())
                .storeId(b.getStore().getId())
                .storeName(b.getStore().getName())
                .expenseCategoryId(b.getExpenseCategory().getId())
                .expenseCategoryCode(b.getExpenseCategory().getCode())
                .expenseCategoryName(b.getExpenseCategory().getName())
                .periodMonth(b.getPeriodMonth())
                .periodYear(b.getPeriodYear())
                .requestedAmount(b.getRequestedAmount())
                .approvedAmount(b.getApprovedAmount())
                .status(b.getStatus())
                .requestedById(b.getRequestedBy() != null ? b.getRequestedBy().getId() : null)
                .requestedByName(b.getRequestedBy() != null ? b.getRequestedBy().getFullName() : null)
                .approvedById(b.getApprovedBy() != null ? b.getApprovedBy().getId() : null)
                .approvedByName(b.getApprovedBy() != null ? b.getApprovedBy().getFullName() : null)
                .justification(b.getJustification())
                .notes(b.getNotes())
                .createdAt(b.getCreatedAt())
                .build();
    }
}
