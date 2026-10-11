package com.sms.finance.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.Data;

@Data
public class HandoverCashRequest {

    @NotNull
    private UUID handoverToEmployeeId;

    private String notes;
}
