package com.sms.finance.dto;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CustomerCreditSummaryResponse {
    private UUID customerId;
    private String customerName;
    private BigDecimal totalFinanced;
    private BigDecimal totalPaid;
    private BigDecimal remainingBalance;
    private BigDecimal unallocatedCredit;
    private int activeReceivablesCount;
    private int overdueInstallmentsCount;
    private BigDecimal overdueAmount;
}
