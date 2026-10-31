package com.sms.storefront.controller;

import com.sms.storefront.dto.AddToCartRequest;
import com.sms.storefront.dto.StorefrontCartDto;
import com.sms.storefront.service.StorefrontCartService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/storefront/cart")
@RequiredArgsConstructor
public class StorefrontCartController {

    private final StorefrontCartService cartService;

    @GetMapping
    public StorefrontCartDto getCart(@RequestHeader(value = "X-Session-ID", required = false) String sessionId) {
        return cartService.getCart(sessionId);
    }

    @PostMapping("/items")
    public StorefrontCartDto addItem(
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId,
            @Valid @RequestBody AddToCartRequest request) {
        return cartService.addItem(sessionId, request);
    }

    @PutMapping("/items/{itemId}")
    public StorefrontCartDto updateItemQuantity(
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId,
            @PathVariable UUID itemId,
            @RequestParam int quantity) {
        return cartService.updateItemQuantity(sessionId, itemId, quantity);
    }

    @DeleteMapping("/items/{itemId}")
    public StorefrontCartDto removeItem(
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId,
            @PathVariable UUID itemId) {
        return cartService.removeItem(sessionId, itemId);
    }

    @DeleteMapping
    public void clearCart(@RequestHeader(value = "X-Session-ID", required = false) String sessionId) {
        cartService.clearCart(sessionId);
    }
}

