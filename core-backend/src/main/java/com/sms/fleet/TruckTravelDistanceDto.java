package com.sms.fleet;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TruckTravelDistanceDto {
    private UUID vehicleId;
    private String registrationNumber;
    private String brandModel;
    private BigDecimal totalDeliveryDistanceKm;
    private BigDecimal currentMonthDeliveryDistanceKm;
    private Long completedDeliveryTripsCount;
    private Integer currentOdometerKm;
    private Integer lastServiceOdometerKm;
    private Integer odometerSinceLastServiceKm;
    private Integer serviceIntervalKm;
    private Boolean isServiceDue;
    private List<DeliveryTripDistancePointDto> recentTrips;
}

