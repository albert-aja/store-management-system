package com.sms.customer.crm.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PtpRequest(
        UUID salesOrderId,
        @NotNull @DecimalMin("1.00") BigDecimal promisedAmount,
        @NotNull LocalDate promisedDate,
        String notes
) {}

