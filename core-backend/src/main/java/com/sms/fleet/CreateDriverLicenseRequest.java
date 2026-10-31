package com.sms.fleet;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateDriverLicenseRequest {

    @NotBlank(message = "License number is required")
    private String licenseNumber;

    @NotNull(message = "License type is required")
    private DriverLicenseType licenseType;

    private LocalDate issueDate;

    @NotNull(message = "Expiry date is required")
    private LocalDate expiryDate;

    private String issuingPoliceOffice;
    private String photoUrl;
    private String notes;
}

