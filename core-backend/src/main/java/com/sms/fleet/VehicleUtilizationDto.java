package com.sms.fleet;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleUtilizationDto {
    private String registrationNumber;
    private String brandModel;
    private String vehicleType;
    private int totalTrips;
    private double totalDistanceKm;
    private double activeHours;
    private double utilizationPct;
    private String status;
}

