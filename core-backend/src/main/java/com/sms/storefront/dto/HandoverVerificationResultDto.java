package com.sms.storefront.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HandoverVerificationResultDto {
    private boolean success;
    private String orderNumber;
    private int groupNumber;
    private UUID fulfillmentGroupId;
    private String pickupPassCode;
    private Instant handedOverAt;
    private String staffEmployeeName;
    private String customerName;
    private String recipientIdentityName;
    private BigDecimal settledAmount;
    private String message;
}

