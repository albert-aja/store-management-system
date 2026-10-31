package com.sms.storefront.controller;

import com.sms.storefront.dto.WishlistShareDto.CreatedShareResponse;
import com.sms.storefront.dto.WishlistShareDto.ShareSummaryResponse;
import com.sms.storefront.service.StorefrontAuthService;
import com.sms.storefront.service.WishlistShareService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/** Owner management of wishlist shares: verified customer JWT, or guest X-Session-ID when signed out. */
@RestController
@RequestMapping("/api/v1/storefront/wishlist/shares")
@RequiredArgsConstructor
public class WishlistShareController {
    private final WishlistShareService shareService;
    private final StorefrontAuthService authService;

    @PostMapping
    public CreatedShareResponse create(
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId,
            @AuthenticationPrincipal Jwt jwt) {
        return shareService.createShare(sessionId, authService.customerId(jwt));
    }

    @GetMapping
    public List<ShareSummaryResponse> list(
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId,
            @AuthenticationPrincipal Jwt jwt) {
        return shareService.listShares(sessionId, authService.customerId(jwt));
    }

    @DeleteMapping("/{shareId}")
    public void revoke(
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId,
            @AuthenticationPrincipal Jwt jwt, @PathVariable UUID shareId) {
        shareService.revokeShare(sessionId, authService.customerId(jwt), shareId);
    }
}
