package com.sms.storefront.controller;

import com.sms.storefront.dto.StorefrontCartDto;
import com.sms.storefront.dto.StorefrontWishlistDto.*;
import com.sms.storefront.service.StorefrontAuthService;
import com.sms.storefront.service.StorefrontWishlistService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/storefront/wishlist")
@RequiredArgsConstructor
public class StorefrontWishlistController {
    private final StorefrontWishlistService wishlistService;
    private final StorefrontAuthService authService;

    @GetMapping
    public WishlistSummaryDto getWishlist(
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId,
            @AuthenticationPrincipal Jwt jwt) {
        return wishlistService.getWishlist(sessionId, authService.customerId(jwt));
    }

    @PostMapping("/items")
    public WishlistItemDto addItem(
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody AddToWishlistRequest request) {
        return wishlistService.addToWishlist(sessionId, authService.customerId(jwt), request);
    }

    @DeleteMapping("/items/{itemId}")
    public void removeItem(
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId,
            @AuthenticationPrincipal Jwt jwt, @PathVariable UUID itemId) {
        wishlistService.checkOwnership(sessionId, authService.customerId(jwt), itemId);
        wishlistService.removeFromWishlist(itemId);
    }

    @DeleteMapping("/products/{productId}")
    public void removeByProductId(
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId,
            @AuthenticationPrincipal Jwt jwt, @PathVariable UUID productId) {
        wishlistService.removeByProductId(sessionId, authService.customerId(jwt), productId);
    }

    @GetMapping("/check/{productId}")
    public CheckWishlistResponse isWishlisted(
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId,
            @AuthenticationPrincipal Jwt jwt, @PathVariable UUID productId) {
        return wishlistService.isWishlisted(sessionId, authService.customerId(jwt), productId);
    }

    @PostMapping("/items/{itemId}/move-to-cart")
    public StorefrontCartDto moveToCart(
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId,
            @AuthenticationPrincipal Jwt jwt, @PathVariable UUID itemId) {
        UUID customerId = authService.customerId(jwt);
        wishlistService.checkOwnership(sessionId, customerId, itemId);
        return wishlistService.moveToCart(sessionId, customerId, itemId);
    }

    @PostMapping("/sync")
    public WishlistSummaryDto syncWishlist(
            @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody SyncWishlistRequest request) {
        return wishlistService.syncWishlist(request.guestSessionId(), authService.requireCustomerId(jwt));
    }

    @PostMapping("/items/{itemId}/simulate-price-drop")
    public WishlistItemDto simulatePriceDrop(
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId,
            @AuthenticationPrincipal Jwt jwt, @PathVariable UUID itemId,
            @RequestBody(required = false) PriceDropSimulationRequest request) {
        wishlistService.checkOwnership(sessionId, authService.customerId(jwt), itemId);
        return wishlistService.simulatePriceDrop(itemId, request != null ? request.newPrice() : null);
    }
}
