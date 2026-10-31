package com.sms.fleet;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FleetAnalyticsDto {
    private LocalDate startDate;
    private LocalDate endDate;
    private double totalDistanceKm;
    private double totalActiveHours;
    private double totalPausedHours;
    private int completedTripsCount;
    private int completedDeliveriesCount;
    private int completedSurveysCount;
    private int completedCollectionsCount;
    private double avgVisitDurationMinutes;
    private double avgTransitDurationMinutes;
    private double overallVehicleUtilizationPct;
    private List<VehicleUtilizationDto> vehicleUtilization;
    private List<RoleProductivityDto> roleProductivity;
    private Map<String, Integer> interruptionCounts;
    private String ethicalDecisionNotice;
}

