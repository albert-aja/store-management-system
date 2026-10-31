package com.sms.storefront.dto;

public record StorefrontBannerDto(
        String id,
        String title,
        String subtitle,
        String badgeText,
        String imageUrl,
        String targetUrl,
        String ctaText
) {}

