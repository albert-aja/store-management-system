package com.sms.finance.dto;

import com.sms.finance.CustomerPayment;
import com.sms.finance.PaymentMethod;
import com.sms.finance.PaymentType;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CustomerPaymentResponse {
    private UUID id;
    private String paymentNumber;
    private UUID storeId;
    private String storeName;
    private UUID customerId;
    private String customerName;
    private UUID salesOrderId;
    private String salesOrderNumber;
    private BigDecimal amount;
    private PaymentType paymentType;
    private PaymentMethod paymentMethod;
    private String referenceNumber;
    private UUID collectedById;
    private String collectedByName;
    private Instant paidAt;
    private BigDecimal unallocatedAmount;
    private String notes;
    private List<PaymentAllocationResponse> allocations;

    public static CustomerPaymentResponse from(CustomerPayment p) {
        return CustomerPaymentResponse.builder()
                .id(p.getId())
                .paymentNumber(p.getPaymentNumber())
                .storeId(p.getStore().getId())
                .storeName(p.getStore().getName())
                .customerId(p.getCustomer().getId())
                .customerName(p.getCustomer().getFullName())
                .salesOrderId(p.getSalesOrder() != null ? p.getSalesOrder().getId() : null)
                .salesOrderNumber(p.getSalesOrder() != null ? p.getSalesOrder().getNumber() : null)
                .amount(p.getAmount())
                .paymentType(p.getPaymentType())
                .paymentMethod(p.getPaymentMethod())
                .referenceNumber(p.getReferenceNumber())
                .collectedById(p.getCollectedBy() != null ? p.getCollectedBy().getId() : null)
                .collectedByName(p.getCollectedBy() != null ? p.getCollectedBy().getFullName() : null)
                .paidAt(p.getPaidAt())
                .unallocatedAmount(p.getUnallocatedAmount())
                .notes(p.getNotes())
                .allocations(p.getAllocations() != null ? p.getAllocations().stream().map(PaymentAllocationResponse::from).toList() : List.of())
                .build();
    }
}
