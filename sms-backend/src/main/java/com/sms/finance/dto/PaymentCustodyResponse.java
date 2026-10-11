package com.sms.finance.dto;

import com.sms.finance.CustodyStatus;
import com.sms.finance.PaymentCustody;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentCustodyResponse {
    private UUID id;
    private UUID customerPaymentId;
    private String paymentNumber;
    private BigDecimal paymentAmount;
    private UUID holderEmployeeId;
    private String holderEmployeeName;
    private UUID handoverToEmployeeId;
    private String handoverToEmployeeName;
    private CustodyStatus status;
    private BigDecimal expectedAmount;
    private BigDecimal receivedAmount;
    private BigDecimal discrepancyAmount;
    private Instant collectedAt;
    private Instant handedOverAt;
    private Instant verifiedAt;
    private String discrepancyNotes;
    private String notes;

    public static PaymentCustodyResponse from(PaymentCustody c) {
        return PaymentCustodyResponse.builder()
                .id(c.getId())
                .customerPaymentId(c.getCustomerPayment().getId())
                .paymentNumber(c.getCustomerPayment().getPaymentNumber())
                .paymentAmount(c.getCustomerPayment().getAmount())
                .holderEmployeeId(c.getHolderEmployee().getId())
                .holderEmployeeName(c.getHolderEmployee().getFullName())
                .handoverToEmployeeId(c.getHandoverToEmployee() != null ? c.getHandoverToEmployee().getId() : null)
                .handoverToEmployeeName(c.getHandoverToEmployee() != null ? c.getHandoverToEmployee().getFullName() : null)
                .status(c.getStatus())
                .expectedAmount(c.getExpectedAmount())
                .receivedAmount(c.getReceivedAmount())
                .discrepancyAmount(c.getDiscrepancyAmount())
                .collectedAt(c.getCollectedAt())
                .handedOverAt(c.getHandedOverAt())
                .verifiedAt(c.getVerifiedAt())
                .discrepancyNotes(c.getDiscrepancyNotes())
                .notes(c.getNotes())
                .build();
    }
}
