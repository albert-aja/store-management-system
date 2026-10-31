package com.sms.fleet;

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
public class AvailableDriverDto {
    private UUID employeeId;
    private String employeeNumber;
    private String fullName;
    private String phone;
    private boolean isAssigned;
    private UUID assignedVehicleId;
    private String assignedRegistrationNumber;

    // Driver License (SIM) Info
    private String primaryLicenseNumber;
    private DriverLicenseType primaryLicenseType;
    private LocalDate primaryLicenseExpiryDate;
    private Long primaryLicenseDaysRemaining;
    private String primaryLicenseStatus; // VALID, EXPIRING_SOON, EXPIRED, NOT_RECORDED
}
