package com.sms.pricing.dto;

import java.time.LocalDate;

public record GeneratePriceListVersionRequest(
        String groupBy,
        LocalDate validFrom,
        String notes
) {}

