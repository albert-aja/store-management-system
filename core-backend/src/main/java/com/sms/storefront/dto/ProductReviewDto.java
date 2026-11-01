package com.sms.storefront.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class ProductReviewDto {

    public record SubmitReviewRequest(
            @NotNull UUID productId,
            UUID productVariantId,
            @Min(1) @Max(5) int rating,
            String title,
            @NotBlank String content
    ) {}

    public record ProductReviewItemDto(
            UUID id,
            UUID customerId,
            String customerName,
            int rating,
            String title,
            String content,
            boolean verifiedPurchase,
            Instant createdAt
    ) {}

    public record RatingDistributionDto(
            int stars5,
            int stars4,
            int stars3,
            int stars2,
            int stars1
    ) {}

    public record ProductReviewSummaryDto(
            double averageRating,
            int totalReviews,
            RatingDistributionDto distribution,
            List<ProductReviewItemDto> reviews
    ) {}

    public record ReviewEligibilityDto(
            boolean eligible,
            boolean alreadyReviewed,
            UUID existingReviewId,
            String orderNumber,
            String reason
    ) {}
}

