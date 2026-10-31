package com.sms.pricing.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.Builder;

@Builder
public record PriceListReportResponse(
        UUID storeId,
        String storeName,
        LocalDate effectiveDate,
        List<PriceListGroupDto> groups
) {}
