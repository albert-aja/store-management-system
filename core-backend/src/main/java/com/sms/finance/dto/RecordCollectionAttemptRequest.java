package com.sms.finance.dto;

import com.sms.finance.CollectionOutcome;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Data;

@Data
public class RecordCollectionAttemptRequest {

    @NotNull
    private UUID storeId;

    @NotNull
    private UUID customerId;

    private UUID receivableId;

    @NotNull
    private UUID assignedEmployeeId;

    @NotNull
    private LocalDate visitDate;

    @NotNull
    private CollectionOutcome outcome;

    private LocalDate promisedPaymentDate;

    private String customerAddressVisited;

    private UUID customerPaymentId;

    private String notes;
}
