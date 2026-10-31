package com.sms.customer.crm.dto;

import com.sms.customer.crm.CustomerPromiseToPay;
import com.sms.customer.crm.PtpStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PtpResponse(
        UUID id,
        UUID customerId,
        String customerName,
        UUID salesOrderId,
        String salesOrderNumber,
        BigDecimal promisedAmount,
        LocalDate promisedDate,
        PtpStatus status,
        String notes,
        String recordedByName,
        Instant resolvedAt,
        Instant createdAt
) {
    public static PtpResponse from(CustomerPromiseToPay ptp) {
        String soNum = ptp.getSalesOrder() != null ? ptp.getSalesOrder().getNumber() : null;
        String rec = ptp.getRecordedBy() != null ? ptp.getRecordedBy().getFullName() : "Staff";
        return new PtpResponse(
                ptp.getId(),
                ptp.getCustomer().getId(),
                ptp.getCustomer().getFullName(),
                ptp.getSalesOrder() != null ? ptp.getSalesOrder().getId() : null,
                soNum,
                ptp.getPromisedAmount(),
                ptp.getPromisedDate(),
                ptp.getStatus(),
                ptp.getNotes(),
                rec,
                ptp.getResolvedAt(),
                ptp.getCreatedAt()
        );
    }
}

