package com.sms.fleet;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangeLicensePlateRequest {

    @NotBlank(message = "New license plate number is required")
    private String newRegistrationNumber;

    @NotNull(message = "Change date is required")
    private LocalDate changeDate;

    @NotBlank(message = "Reason for plate change is required")
    private String reason;

    private String notes;

    /** Optional: if this change is part of 5-year STNK renewal, update STNK expiry date */
    private LocalDate newStnkExpiryDate;

    /** Optional: update 1-year annual tax due date if settled during plate renewal */
    private LocalDate newTaxDueDate;

    private UUID changedByEmployeeId;
}

