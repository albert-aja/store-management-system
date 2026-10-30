package com.sms.customer.crm.dto;

import com.sms.customer.crm.StoreCreditEntry;
import com.sms.customer.crm.StoreCreditType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record StoreCreditRequest(
        @NotNull @DecimalMin("1.00") BigDecimal amount,
        String reason,
        String referenceType,
        UUID referenceId
) {}

