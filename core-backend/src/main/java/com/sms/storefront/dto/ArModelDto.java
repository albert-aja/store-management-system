package com.sms.storefront.dto;

import java.util.List;

public record ArModelDto(
        boolean isSupported,
        String furnitureType,
        String modelGlbUrl,
        String modelUsdzUrl,
        int widthCm,
        int depthCm,
        int heightCm,
        String defaultColor,
        List<ArColorVariantDto> colorVariants,
        List<ArHotspotDto> hotspots,
        String roomPlacement,
        String recommendedRoom
) {
    public record ArColorVariantDto(
            String name,
            String hexCode,
            String materialFinish
    ) {}

    public record ArHotspotDto(
            String title,
            String description,
            double relativeX,
            double relativeY,
            double relativeZ
    ) {}
}

