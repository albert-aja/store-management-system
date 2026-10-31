package com.sms.finance.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class VerifyCashRequest {

    @NotNull
    private BigDecimal receivedAmount;

    private String discrepancyNotes;
}
