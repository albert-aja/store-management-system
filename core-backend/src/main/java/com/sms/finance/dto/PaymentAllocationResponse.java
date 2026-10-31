package com.sms.finance.dto;

import com.sms.finance.PaymentAllocation;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentAllocationResponse {
    private UUID id;
    private UUID customerPaymentId;
    private UUID receivableInstallmentId;
    private int installmentNumber;
    private String receivableNumber;
    private BigDecimal amount;
    private Instant allocatedAt;

    public static PaymentAllocationResponse from(PaymentAllocation a) {
        return PaymentAllocationResponse.builder()
                .id(a.getId())
                .customerPaymentId(a.getCustomerPayment().getId())
                .receivableInstallmentId(a.getReceivableInstallment().getId())
                .installmentNumber(a.getReceivableInstallment().getInstallmentNumber())
                .receivableNumber(a.getReceivableInstallment().getReceivable().getReceivableNumber())
                .amount(a.getAmount())
                .allocatedAt(a.getAllocatedAt())
                .build();
    }
}
