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
public class FleetMaintenanceAlertDto {
    private UUID id;
    private UUID vehicleId;
    private String registrationNumber;
    private String brandModel;
    private UUID storeId;
    private String storeName;
    private String alertType; // STNK_EXPIRING, KIR_EXPIRING, SERVICE_DUE, STNK_EXPIRED, KIR_EXPIRED
    private String severity;  // WARNING, CRITICAL, EXPIRED
    private String title;
    private String description;
    private LocalDate targetDate;
    private Long daysRemaining;
    private Integer currentOdometerKm;
    private Integer lastServiceOdometerKm;
}

