package com.sms.pricing.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;

@Builder
public record PriceListVersionDto(
        UUID id,
        UUID storeId,
        String storeName,
        String versionCode,
        String title,
        LocalDate validFrom,
        String groupBy,
        String fileName,
        String mimeType,
        long fileSizeBytes,
        int itemCount,
        String notes,
        Instant createdAt,
        UUID createdBy,
        String viewUrl,
        String downloadUrl
) {}

