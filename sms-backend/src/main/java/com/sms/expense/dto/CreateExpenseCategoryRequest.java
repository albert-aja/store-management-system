package com.sms.expense.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateExpenseCategoryRequest {
    @NotBlank
    private String code;

    @NotBlank
    private String name;

    private String description;
    private BigDecimal monthlyLimit;
    private boolean requiresReceipt = true;
}
