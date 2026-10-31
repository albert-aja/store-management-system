package com.sms.storefront.service;

import com.sms.common.web.BusinessRuleException;
import com.sms.common.web.ConflictException;
import com.sms.common.web.NotFoundException;
import com.sms.product.dto.Product;
import com.sms.product.dto.ProductVariant;
import com.sms.product.repository.ProductVariantRepository;
import com.sms.storefront.dto.WishlistShareDto.CreatedShareResponse;
import com.sms.storefront.dto.WishlistShareDto.PublicShareItem;
import com.sms.storefront.dto.WishlistShareDto.PublicShareResponse;
import com.sms.storefront.dto.WishlistShareDto.ReservationResponse;
import com.sms.storefront.dto.WishlistShareDto.ShareSummaryResponse;
import com.sms.storefront.model.CustomerWishlistItem;
import com.sms.storefront.model.WishlistShare;
import com.sms.storefront.model.WishlistShareItem;
import com.sms.storefront.repository.CustomerWishlistItemRepository;
import com.sms.storefront.repository.WishlistShareItemRepository;
import com.sms.storefront.repository.WishlistShareRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Owner-managed, time-limited public snapshots of a wishlist with anonymous gift reservation intent.
 * A reservation is a social signal only: it is not a purchase and never holds stock.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class WishlistShareService {

    public static final Duration SHARE_TTL = Duration.ofDays(30);
    static final String SHARE_NOT_FOUND = "Wishlist share not found";

    private static final int SECRET_BYTES = 32;
    private static final int MAX_SESSION_LENGTH = 100;
    /** 32 random bytes encoded as unpadded base64url are exactly 43 URL-safe characters. */
    private static final Pattern SECRET_FORMAT = Pattern.compile("^[A-Za-z0-9_-]{43}$");
    private static final SecureRandom RANDOM = new SecureRandom();

    private final WishlistShareRepository shareRepository;
    private final WishlistShareItemRepository shareItemRepository;
    private final CustomerWishlistItemRepository wishlistRepository;
    private final ProductVariantRepository productVariantRepository;
    private final Clock clock;

    public CreatedShareResponse createShare(String sessionId, UUID customerId) {
        Owner owner = Owner.of(customerId, sessionId);
        List<CustomerWishlistItem> wishlist = owner.customerId() != null
                ? wishlistRepository.findByCustomerIdOrderByCreatedAtDesc(owner.customerId())
                : wishlistRepository.findBySessionIdOrderByCreatedAtDesc(owner.sessionId());

        Map<UUID, WishlistShareItem> snapshot = new LinkedHashMap<>();
        for (CustomerWishlistItem entry : wishlist) {
            WishlistShareItem item = snapshotOf(entry);
            if (item != null) {
                snapshot.putIfAbsent(item.getProductId(), item);
            }
        }
        if (snapshot.isEmpty()) {
            throw new BusinessRuleException("Cannot share an empty wishlist");
        }

        Instant now = clock.instant();
        String token = generateSecret();
        WishlistShare share = new WishlistShare();
        share.setOwnerCustomerId(owner.customerId());
        share.setOwnerSessionId(owner.customerId() == null ? owner.sessionId() : null);
        share.setTokenHash(sha256Hex(token));
        share.setExpiresAt(now.plus(SHARE_TTL));
        snapshot.values().forEach(share::addItem);

        WishlistShare saved = shareRepository.save(share);
        Instant createdAt = saved.getCreatedAt() != null ? saved.getCreatedAt() : now;
        return new CreatedShareResponse(saved.getId(), token, createdAt, saved.getExpiresAt());
    }

    @Transactional(readOnly = true)
    public List<ShareSummaryResponse> listShares(String sessionId, UUID customerId) {
        Owner owner = Owner.of(customerId, sessionId);
        List<WishlistShare> shares = owner.customerId() != null
                ? shareRepository.findByOwnerCustomerIdOrderByCreatedAtDesc(owner.customerId())
                : shareRepository.findGuestShares(owner.sessionId());
        return shares.stream()
                .map(s -> new ShareSummaryResponse(s.getId(), s.getCreatedAt(), s.getExpiresAt(), s.getRevokedAt()))
                .toList();
    }

    /** Idempotent; shares owned by anyone else are indistinguishable from missing ones. */
    public void revokeShare(String sessionId, UUID customerId, UUID shareId) {
        Owner owner = Owner.of(customerId, sessionId);
        WishlistShare share = (owner.customerId() != null
                ? shareRepository.findByIdAndOwnerCustomerId(shareId, owner.customerId())
                : shareRepository.findGuestShare(shareId, owner.sessionId()))
                .orElseThrow(() -> new NotFoundException(SHARE_NOT_FOUND));
        if (share.getRevokedAt() == null) {
            share.setRevokedAt(clock.instant());
            shareRepository.save(share);
        }
    }

    @Transactional(readOnly = true)
    public PublicShareResponse getPublicShare(String token) {
        WishlistShare share = requireActive(token, clock.instant());
        List<PublicShareItem> items = share.getItems().stream()
                .map(i -> new PublicShareItem(i.getId(), i.getProductId(), i.getVariantId(), i.getProductName(),
                        i.getVariantName(), i.getPrimaryImageUrl(), 1, i.isReserved()))
                .toList();
        return new PublicShareResponse(share.getCreatedAt(), share.getExpiresAt(), items);
    }

    public ReservationResponse reserveItem(String token, UUID itemId) {
        Instant now = clock.instant();
        WishlistShare share = requireActive(token, now);
        String cancellationKey = generateSecret();
        if (shareItemRepository.claim(share.getId(), itemId, sha256Hex(cancellationKey), now) == 1) {
            return new ReservationResponse(cancellationKey);
        }
        if (shareItemRepository.existsByIdAndShareId(itemId, share.getId())) {
            throw new ConflictException("This item has already been reserved");
        }
        throw new NotFoundException(SHARE_NOT_FOUND);
    }

    public void cancelReservation(String token, UUID itemId, String cancellationKey) {
        Instant now = clock.instant();
        WishlistShare share = requireActive(token, now);
        if (!isWellFormedSecret(cancellationKey)
                || shareItemRepository.release(share.getId(), itemId, sha256Hex(cancellationKey), now) != 1) {
            throw new NotFoundException(SHARE_NOT_FOUND);
        }
    }

    private WishlistShare requireActive(String token, Instant now) {
        if (!isWellFormedSecret(token)) {
            throw new NotFoundException(SHARE_NOT_FOUND);
        }
        return shareRepository.findByTokenHash(sha256Hex(token))
                .filter(share -> share.isActiveAt(now))
                .orElseThrow(() -> new NotFoundException(SHARE_NOT_FOUND));
    }

    private WishlistShareItem snapshotOf(CustomerWishlistItem entry) {
        Product product = entry.getProduct();
        ProductVariant variant = entry.getProductVariant();
        if (product == null && variant != null) {
            product = variant.getProduct();
        }
        if (product == null || product.getId() == null) {
            return null;
        }
        if (variant == null) {
            List<ProductVariant> variants = productVariantRepository.findByProductIdOrderByVariantName(product.getId());
            variant = variants.isEmpty() ? null : variants.get(0);
        }
        WishlistShareItem item = new WishlistShareItem();
        item.setProductId(product.getId());
        item.setVariantId(variant != null ? variant.getId() : null);
        item.setProductName(product.getName());
        item.setVariantName(variant != null ? variant.getVariantName() : null);
        item.setPrimaryImageUrl(StorefrontWishlistService.resolveProductImage(product));
        item.setQuantity(1);
        return item;
    }

    static String generateSecret() {
        byte[] bytes = new byte[SECRET_BYTES];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    static String sha256Hex(String secret) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(secret.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    private static boolean isWellFormedSecret(String secret) {
        return secret != null && SECRET_FORMAT.matcher(secret).matches();
    }

    /** Verified customer wins; otherwise the exact non-blank guest session the wishlist is stored under. */
    private record Owner(UUID customerId, String sessionId) {
        static Owner of(UUID customerId, String sessionId) {
            if (customerId != null) {
                return new Owner(customerId, null);
            }
            if (sessionId == null || sessionId.isBlank() || sessionId.length() > MAX_SESSION_LENGTH) {
                throw new BadCredentialsException("Sign in or provide a guest session to manage wishlist shares");
            }
            return new Owner(null, sessionId);
        }
    }
}
