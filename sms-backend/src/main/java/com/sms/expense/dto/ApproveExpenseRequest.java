package com.sms.expense.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApproveExpenseRequest {
    @NotNull
    private UUID approvedById;

    private boolean approved = true;
    private String notes;
}
