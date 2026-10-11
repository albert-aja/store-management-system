package com.sms.finance.dto;

import com.sms.finance.Receivable;
import com.sms.finance.ReceivableStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReceivableResponse {
    private UUID id;
    private String receivableNumber;
    private UUID storeId;
    private String storeName;
    private UUID customerId;
    private String customerName;
    private UUID salesOrderId;
    private String salesOrderNumber;
    private UUID salesOrderItemId;
    private BigDecimal totalAmount;
    private BigDecimal downPaymentAmount;
    private BigDecimal financedAmount;
    private BigDecimal totalPaid;
    private BigDecimal remainingBalance;
    private int paymentTermMonths;
    private ReceivableStatus status;
    private LocalDate firstDueDate;
    private Instant createdAt;
    private List<ReceivableInstallmentResponse> installments;

    public static ReceivableResponse from(Receivable r) {
        return ReceivableResponse.builder()
                .id(r.getId())
                .receivableNumber(r.getReceivableNumber())
                .storeId(r.getStore().getId())
                .storeName(r.getStore().getName())
                .customerId(r.getCustomer().getId())
                .customerName(r.getCustomer().getFullName())
                .salesOrderId(r.getSalesOrder().getId())
                .salesOrderNumber(r.getSalesOrder().getNumber())
                .salesOrderItemId(r.getSalesOrderItem() != null ? r.getSalesOrderItem().getId() : null)
                .totalAmount(r.getTotalAmount())
                .downPaymentAmount(r.getDownPaymentAmount())
                .financedAmount(r.getFinancedAmount())
                .totalPaid(r.getTotalPaid())
                .remainingBalance(r.getRemainingBalance())
                .paymentTermMonths(r.getPaymentTermMonths())
                .status(r.getStatus())
                .firstDueDate(r.getFirstDueDate())
                .createdAt(r.getCreatedAt())
                .installments(r.getInstallments() != null ? r.getInstallments().stream().map(ReceivableInstallmentResponse::from).toList() : List.of())
                .build();
    }
}
