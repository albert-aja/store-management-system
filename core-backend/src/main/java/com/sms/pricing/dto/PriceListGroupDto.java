package com.sms.pricing.dto;

import java.util.List;

public record PriceListGroupDto(
        String groupName,
        List<PriceListItemDto> items
) {}
