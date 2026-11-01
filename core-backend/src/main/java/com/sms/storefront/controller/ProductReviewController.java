package com.sms.storefront.controller;

import com.sms.storefront.dto.ProductReviewDto.*;
import com.sms.storefront.service.ProductReviewService;
import com.sms.storefront.service.StorefrontAuthService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/storefront/reviews")
@RequiredArgsConstructor
public class ProductReviewController {

    private final ProductReviewService reviewService;
    private final StorefrontAuthService authService;

    @GetMapping("/products/{productId}")
    public ProductReviewSummaryDto getProductReviews(@PathVariable UUID productId) {
        return reviewService.getProductReviews(productId);
    }

    @GetMapping("/eligibility/{productId}")
    public ReviewEligibilityDto checkEligibility(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID productId) {
        UUID customerId = authService.customerId(jwt);
        return reviewService.checkEligibility(customerId, productId);
    }

    @PostMapping
    public ProductReviewItemDto submitReview(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody SubmitReviewRequest request) {
        UUID customerId = authService.requireCustomerId(jwt);
        return reviewService.submitReview(customerId, request);
    }
}

