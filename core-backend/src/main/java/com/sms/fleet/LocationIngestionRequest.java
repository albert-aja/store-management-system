package com.sms.fleet;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.Data;

@Data
public class LocationIngestionRequest {
    @NotEmpty(message = "Location points list cannot be empty")
    @Valid
    private List<LocationPointDto> points;
}

