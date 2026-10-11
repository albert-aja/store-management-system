package com.sms.delivery;

import jakarta.validation.constraints.NotBlank;

public record FailDeliveryOrderRequest(
        @NotBlank String failureReason,
        String notes
) {}
