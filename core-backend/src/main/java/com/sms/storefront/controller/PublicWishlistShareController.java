package com.sms.storefront.controller;

import com.sms.storefront.dto.WishlistShareDto.CancelReservationRequest;
import com.sms.storefront.dto.WishlistShareDto.PublicShareResponse;
import com.sms.storefront.dto.WishlistShareDto.ReservationResponse;
import com.sms.storefront.service.WishlistShareService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/** Anonymous, read-only shared wishlist plus gift reservation intent. No authentication or session is used. */
@RestController
@RequestMapping("/api/v1/storefront/wishlist/share/{token}")
@RequiredArgsConstructor
public class PublicWishlistShareController {
    private final WishlistShareService shareService;

    @GetMapping
    public PublicShareResponse view(@PathVariable String token, HttpServletResponse response) {
        privateNoStore(response);
        return shareService.getPublicShare(token);
    }

    @PostMapping("/items/{itemId}/reservation")
    public ReservationResponse reserve(@PathVariable String token, @PathVariable UUID itemId,
                                       HttpServletResponse response) {
        privateNoStore(response);
        return shareService.reserveItem(token, itemId);
    }

    @DeleteMapping("/items/{itemId}/reservation")
    public void cancel(@PathVariable String token, @PathVariable UUID itemId,
                       @Valid @RequestBody CancelReservationRequest request, HttpServletResponse response) {
        privateNoStore(response);
        shareService.cancelReservation(token, itemId, request.cancellationKey());
    }

    private static void privateNoStore(HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("Referrer-Policy", "no-referrer");
        response.setHeader("X-Robots-Tag", "noindex, nofollow");
    }
}
