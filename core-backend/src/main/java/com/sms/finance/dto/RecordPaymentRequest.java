package com.sms.finance.dto;

import com.sms.finance.PaymentMethod;
import com.sms.finance.PaymentType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

@Data
public class RecordPaymentRequest {

    @NotNull
    private UUID storeId;

    @NotNull
    private UUID customerId;

    private UUID salesOrderId;

    @NotNull
    @Positive
    private BigDecimal amount;

    private PaymentType paymentType = PaymentType.INSTALLMENT;

    private PaymentMethod paymentMethod = PaymentMethod.CASH;

    private String referenceNumber;

    private UUID collectedById;

    private UUID specificInstallmentId;

    private String notes;
}
