package com.sms.finance.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Data;

@Data
public class CreateReceivableRequest {

    @NotNull
    private UUID salesOrderId;

    private UUID salesOrderItemId;

    private BigDecimal downPaymentAmount;

    private LocalDate firstDueDate;
}
