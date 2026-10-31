package com.sms.fleet;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Data;

@Data
public class RecordSessionEventRequest {
    @NotNull(message = "Event type is required")
    private TrackingEventType eventType;

    private Instant eventTimestamp;
    private String reasonCode;
    private String notes;
    private BigDecimal locationLatitude;
    private BigDecimal locationLongitude;
}

