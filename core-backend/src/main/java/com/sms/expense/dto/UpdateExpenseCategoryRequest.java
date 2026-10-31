package com.sms.expense.dto;

import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateExpenseCategoryRequest {
    private String name;
    private String description;
    private BigDecimal monthlyLimit;
    private Boolean requiresReceipt;
    private Boolean active;
}
