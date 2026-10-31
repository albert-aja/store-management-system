package com.sms.storefront.controller;

import com.sms.storefront.dto.StorefrontAuthDto;
import com.sms.storefront.service.StorefrontAuthService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/storefront/auth")
@RequiredArgsConstructor
public class StorefrontAuthController {

    private final StorefrontAuthService authService;

    @PostMapping("/session")
    public StorefrontAuthDto.ProfileResponse session(@AuthenticationPrincipal Jwt jwt) {
        return authService.session(jwt);
    }

    @GetMapping("/profile/{customerId}")
    public StorefrontAuthDto.ProfileResponse getProfile(
            @AuthenticationPrincipal Jwt jwt, @PathVariable UUID customerId) {
        return authService.getProfile(jwt, customerId);
    }
}
