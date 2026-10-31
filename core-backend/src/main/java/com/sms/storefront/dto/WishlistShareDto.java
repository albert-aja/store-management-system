package com.sms.storefront.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Wishlist share contracts. Public records deliberately expose no owner identity, session, notes,
 * prices, reservation timestamps, or secret material other than a one-time cancellation key.
 */
public final class WishlistShareDto {

    private WishlistShareDto() {
    }

    /** Returned once on creation; the raw token is never retrievable again. */
    public record CreatedShareResponse(UUID id, String token, Instant createdAt, Instant expiresAt) {}

    public record ShareSummaryResponse(UUID id, Instant createdAt, Instant expiresAt, Instant revokedAt) {}

    public record PublicShareResponse(Instant createdAt, Instant expiresAt, List<PublicShareItem> items) {}

    public record PublicShareItem(
            UUID id,
            UUID productId,
            UUID variantId,
            String productName,
            String variantName,
            String primaryImageUrl,
            int quantity,
            boolean reserved
    ) {}

    public record ReservationResponse(String cancellationKey) {}

    public record CancelReservationRequest(@NotBlank @Size(max = 128) String cancellationKey) {}
}
