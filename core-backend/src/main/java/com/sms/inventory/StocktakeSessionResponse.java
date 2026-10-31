package com.sms.inventory;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record StocktakeSessionResponse(
        UUID id,
        UUID storeId,
        StocktakeStatus status,
        Instant openedAt,
        Instant submittedAt,
        Instant reviewedAt,
        String reviewComment,
        Integer expectedCount,
        Integer countedCount,
        Integer varianceCount,
        List<StocktakeCountLineResponse> lines) {

    public static StocktakeSessionResponse from(StocktakeSession session) {
        List<StocktakeCountLineResponse> lines = session.getLines().stream()
                .map(StocktakeCountLineResponse::from)
                .toList();
        return new StocktakeSessionResponse(
                session.getId(),
                session.getStore().getId(),
                session.getStatus(),
                session.getCreatedAt(),
                session.getSubmittedAt(),
                session.getReviewedAt(),
                session.getReviewComment(),
                (int) lines.stream().filter(StocktakeCountLineResponse::expected).count(),
                (int) lines.stream().filter(StocktakeCountLineResponse::counted).count(),
                (int) lines.stream().filter(line -> line.variance() != null && line.variance() != StocktakeVariance.MATCH).count(),
                lines);
    }

    public static StocktakeSessionResponse blind(StocktakeSession session) {
        return new StocktakeSessionResponse(
                session.getId(),
                session.getStore().getId(),
                session.getStatus(),
                session.getCreatedAt(),
                session.getSubmittedAt(),
                session.getReviewedAt(),
                session.getReviewComment(),
                null,
                null,
                null,
                List.of());
    }
}
