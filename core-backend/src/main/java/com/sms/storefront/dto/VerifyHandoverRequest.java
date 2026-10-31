package com.sms.storefront.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifyHandoverRequest {
    @NotBlank(message = "Pickup pass code or scanned QR payload is required")
    private String pickupPassCode;

    @NotBlank(message = "Staff employee name performing handover is required")
    private String staffEmployeeName;

    private String recipientIdentityName;
    private String recipientPhone;
    private String handoverNotes;
    private boolean settleRemainingBalance;
}

