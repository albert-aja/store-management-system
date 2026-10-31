package com.sms.finance.dto;

import com.sms.finance.CollectionAttempt;
import com.sms.finance.CollectionOutcome;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CollectionAttemptResponse {
    private UUID id;
    private UUID storeId;
    private String storeName;
    private UUID customerId;
    private String customerName;
    private UUID receivableId;
    private String receivableNumber;
    private UUID assignedEmployeeId;
    private String assignedEmployeeName;
    private LocalDate visitDate;
    private CollectionOutcome outcome;
    private LocalDate promisedPaymentDate;
    private String customerAddressVisited;
    private UUID customerPaymentId;
    private String customerPaymentNumber;
    private String notes;

    public static CollectionAttemptResponse from(CollectionAttempt a) {
        return CollectionAttemptResponse.builder()
                .id(a.getId())
                .storeId(a.getStore().getId())
                .storeName(a.getStore().getName())
                .customerId(a.getCustomer().getId())
                .customerName(a.getCustomer().getFullName())
                .receivableId(a.getReceivable() != null ? a.getReceivable().getId() : null)
                .receivableNumber(a.getReceivable() != null ? a.getReceivable().getReceivableNumber() : null)
                .assignedEmployeeId(a.getAssignedEmployee().getId())
                .assignedEmployeeName(a.getAssignedEmployee().getFullName())
                .visitDate(a.getVisitDate())
                .outcome(a.getOutcome())
                .promisedPaymentDate(a.getPromisedPaymentDate())
                .customerAddressVisited(a.getCustomerAddressVisited())
                .customerPaymentId(a.getCustomerPayment() != null ? a.getCustomerPayment().getId() : null)
                .customerPaymentNumber(a.getCustomerPayment() != null ? a.getCustomerPayment().getPaymentNumber() : null)
                .notes(a.getNotes())
                .build();
    }
}
