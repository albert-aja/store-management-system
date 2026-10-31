package com.sms.fleet;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationPointDto {
    @NotNull(message = "Latitude is required")
    private BigDecimal latitude;

    @NotNull(message = "Longitude is required")
    private BigDecimal longitude;

    private BigDecimal accuracyMeters;
    private BigDecimal speedMps;
    private BigDecimal headingDegrees;
    private BigDecimal altitudeMeters;
    private Integer batteryLevelPct;
    private Boolean isMockProvider;

    @NotNull(message = "Recorded timestamp is required")
    private Instant recordedAt;
}

