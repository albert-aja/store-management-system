package com.sms.expense.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApproveBudgetRequest {
    @NotNull
    private UUID approvedById;

    @NotNull
    @DecimalMin("0.00")
    private BigDecimal approvedAmount;

    private boolean approved = true;
    private String notes;
}
