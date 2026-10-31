package com.sms.fleet;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleProductivityDto {
    private String role;
    private int activeStaffCount;
    private int tasksCompleted;
    private double totalDistanceKm;
    private double avgTaskDurationMinutes;
    private double avgTransitDurationMinutes;
    private double efficiencyRating;
}

