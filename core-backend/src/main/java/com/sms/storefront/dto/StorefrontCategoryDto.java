package com.sms.storefront.dto;

import java.util.UUID;

public record StorefrontCategoryDto(
        UUID id,
        String name,
        String code,
        String description,
        String imageUrl,
        long productCount
) {}

