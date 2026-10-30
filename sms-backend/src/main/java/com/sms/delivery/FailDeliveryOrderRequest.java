package com.sms.delivery;

import jakarta.validation.constraints.NotBlank;

public record FailDeliveryOrderRequest(
        @NotBlank String failureReason,
        String notes,
        String proofPhotoUrl
) {
    public FailDeliveryOrderRequest(String failureReason, String notes) {
        this(failureReason, notes, null);
    }
}
