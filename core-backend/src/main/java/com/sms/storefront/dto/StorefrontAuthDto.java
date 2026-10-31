package com.sms.storefront.dto;

import java.util.UUID;

public class StorefrontAuthDto {
    public record ProfileResponse(
            UUID customerId,
            String email,
            String fullName,
            String phone
    ) {}
}
