package com.sms.finance.dto;

import com.sms.finance.InstallmentStatus;
import com.sms.finance.ReceivableInstallment;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReceivableInstallmentResponse {
    private UUID id;
    private UUID receivableId;
    private int installmentNumber;
    private LocalDate dueDate;
    private BigDecimal amountDue;
    private BigDecimal amountPaid;
    private InstallmentStatus status;
    private Instant paidAt;
    private String notes;
    private long daysOverdue;

    public static ReceivableInstallmentResponse from(ReceivableInstallment i) {
        long days = 0;
        if (i.getStatus() != InstallmentStatus.PAID && i.getStatus() != InstallmentStatus.FORGIVEN) {
            LocalDate today = LocalDate.now();
            if (today.isAfter(i.getDueDate())) {
                days = ChronoUnit.DAYS.between(i.getDueDate(), today);
            }
        }
        return ReceivableInstallmentResponse.builder()
                .id(i.getId())
                .receivableId(i.getReceivable().getId())
                .installmentNumber(i.getInstallmentNumber())
                .dueDate(i.getDueDate())
                .amountDue(i.getAmountDue())
                .amountPaid(i.getAmountPaid())
                .status(i.getStatus())
                .paidAt(i.getPaidAt())
                .notes(i.getNotes())
                .daysOverdue(days)
                .build();
    }
}
