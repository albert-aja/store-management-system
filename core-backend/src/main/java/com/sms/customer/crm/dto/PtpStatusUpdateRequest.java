package com.sms.customer.crm.dto;

import com.sms.customer.crm.PtpStatus;
import jakarta.validation.constraints.NotNull;

public record PtpStatusUpdateRequest(
        @NotNull PtpStatus status,
        String notes
) {}

