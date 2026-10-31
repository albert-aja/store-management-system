package com.sms.fleet;

import java.time.Instant;
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
public class DriverLicenseDto {
    private UUID id;
    private UUID employeeId;
    private String employeeNumber;
    private String driverName;
    private String licenseNumber;
    private DriverLicenseType licenseType;
    private String licenseTypeLabel;
    private LocalDate issueDate;
    private LocalDate expiryDate;
    private String issuingPoliceOffice;
    private String photoUrl;
    private String notes;
    private Long daysRemaining;
    private String status; // VALID, EXPIRING_SOON, EXPIRED
    private Instant lastNotificationSentAt;
    private Instant createdAt;
}

