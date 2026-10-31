package com.sms.storefront.dto;

public record DeviceTokenRegisterRequest(
    String customerId,
    String deviceToken,
    String platform, // ANDROID, IOS, WEB
    String deviceModel
) {}

