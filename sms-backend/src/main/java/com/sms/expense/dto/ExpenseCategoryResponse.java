package com.sms.expense.dto;

import com.sms.expense.ExpenseCategory;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ExpenseCategoryResponse {
    private UUID id;
    private String code;
    private String name;
    private String description;
    private BigDecimal monthlyLimit;
    private boolean requiresReceipt;
    private boolean active;
    private Instant createdAt;

    public static ExpenseCategoryResponse from(ExpenseCategory c) {
        return ExpenseCategoryResponse.builder()
                .id(c.getId())
                .code(c.getCode())
                .name(c.getName())
                .description(c.getDescription())
                .monthlyLimit(c.getMonthlyLimit())
                .requiresReceipt(c.isRequiresReceipt())
                .active(c.isActive())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
