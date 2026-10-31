package com.sms.storefront;

import com.sms.common.web.BusinessRuleException;
import com.sms.common.web.ConflictException;
import com.sms.common.web.NotFoundException;
import com.sms.product.dto.Product;
import com.sms.product.dto.ProductVariant;
import com.sms.product.repository.ProductVariantRepository;
import com.sms.storefront.dto.WishlistShareDto.CreatedShareResponse;
import com.sms.storefront.dto.WishlistShareDto.PublicShareResponse;
import com.sms.storefront.dto.WishlistShareDto.ReservationResponse;
import com.sms.storefront.dto.WishlistShareDto.ShareSummaryResponse;
import com.sms.storefront.model.CustomerWishlistItem;
import com.sms.storefront.model.WishlistShare;
import com.sms.storefront.model.WishlistShareItem;
import com.sms.storefront.repository.CustomerWishlistItemRepository;
import com.sms.storefront.repository.WishlistShareItemRepository;
import com.sms.storefront.repository.WishlistShareRepository;
import com.sms.storefront.service.WishlistShareService;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class WishlistShareServiceTest {

    private static final Instant NOW = Instant.parse("2026-10-31T10:00:00Z");

    @Mock private WishlistShareRepository shareRepository;
    @Mock private WishlistShareItemRepository itemRepository;
    @Mock private CustomerWishlistItemRepository wishlistRepository;
    @Mock private ProductVariantRepository variantRepository;

    private MutableClock clock;
    private WishlistShareService service;
    private final UUID customerId = UUID.randomUUID();
    private final String session = "guest-session-1";

    @BeforeEach
    void setUp() {
        clock = new MutableClock(NOW);
        service = new WishlistShareService(shareRepository, itemRepository, wishlistRepository, variantRepository, clock);
        when(shareRepository.save(any(WishlistShare.class))).thenAnswer(inv -> {
            WishlistShare s = inv.getArgument(0);
            if (s.getId() == null) ReflectionTestUtils.setField(s, "id", UUID.randomUUID());
            return s;
        });
    }

    @Test
    void createSnapshotsCustomerWishlistWithoutPricesNotesOrDuplicatesAndStoresOnlyTokenHash() {
        Product tv = product("Smart TV");
        ProductVariant tv55 = variant(tv, "55 inch");
        Product sofa = product("Sofa");
        ProductVariant sofaDefault = variant(sofa, "Grey");
        CustomerWishlistItem a = wish(tv, tv55, "secret note");
        CustomerWishlistItem dup = wish(tv, tv55, null);
        CustomerWishlistItem b = wish(sofa, null, null);
        when(wishlistRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)).thenReturn(List.of(a, dup, b));
        when(variantRepository.findByProductIdOrderByVariantName(sofa.getId())).thenReturn(List.of(sofaDefault));

        CreatedShareResponse created = service.createShare("ignored-session", customerId);

        ArgumentCaptor<WishlistShare> captor = ArgumentCaptor.forClass(WishlistShare.class);
        verify(shareRepository).save(captor.capture());
        WishlistShare saved = captor.getValue();
        assertEquals(customerId, saved.getOwnerCustomerId());
        assertNull(saved.getOwnerSessionId());
        assertEquals(NOW.plus(Duration.ofDays(30)), saved.getExpiresAt());
        assertEquals(NOW.plus(Duration.ofDays(30)), created.expiresAt());
        assertTrue(created.token().matches("^[A-Za-z0-9_-]{43}$"));
        assertEquals(32, Base64.getUrlDecoder().decode(created.token()).length);
        assertEquals(sha256(created.token()), saved.getTokenHash());
        assertNotEquals(created.token(), saved.getTokenHash());

        assertEquals(2, saved.getItems().size());
        WishlistShareItem first = saved.getItems().get(0);
        assertEquals(tv.getId(), first.getProductId());
        assertEquals(tv55.getId(), first.getVariantId());
        assertEquals("Smart TV", first.getProductName());
        assertEquals("55 inch", first.getVariantName());
        assertNotNull(first.getPrimaryImageUrl());
        assertEquals(1, first.getQuantity());
        assertEquals(sofaDefault.getId(), saved.getItems().get(1).getVariantId());
        assertTrue(saved.getItems().stream().noneMatch(WishlistShareItem::isReserved));
    }

    @Test
    void guestShareUsesExactSessionAndRepeatedGenerationYieldsDistinctTokens() {
        when(wishlistRepository.findBySessionIdOrderByCreatedAtDesc(session))
                .thenReturn(List.of(wish(product("Lamp"), null, null)));

        CreatedShareResponse one = service.createShare(session, null);
        CreatedShareResponse two = service.createShare(session, null);

        assertNotEquals(one.token(), two.token());
        assertNotEquals(one.id(), two.id());
        ArgumentCaptor<WishlistShare> captor = ArgumentCaptor.forClass(WishlistShare.class);
        verify(shareRepository, times(2)).save(captor.capture());
        assertEquals(session, captor.getValue().getOwnerSessionId());
        assertNull(captor.getValue().getOwnerCustomerId());
    }

    @Test
    void rejectsEmptyWishlistAndMissingOwnerScope() {
        when(wishlistRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)).thenReturn(List.of());
        assertThrows(BusinessRuleException.class, () -> service.createShare(null, customerId));
        assertThrows(BadCredentialsException.class, () -> service.createShare(null, null));
        assertThrows(BadCredentialsException.class, () -> service.createShare("   ", null));
        assertThrows(BadCredentialsException.class, () -> service.listShares(null, null));
        verify(shareRepository, never()).save(any());
    }

    @Test
    void listReturnsOwnerSharesOnly() {
        WishlistShare share = share(customerId, null, "x");
        when(shareRepository.findByOwnerCustomerIdOrderByCreatedAtDesc(customerId)).thenReturn(List.of(share));
        when(shareRepository.findGuestShares(session)).thenReturn(List.of());

        List<ShareSummaryResponse> customerShares = service.listShares(session, customerId);
        assertEquals(1, customerShares.size());
        assertEquals(share.getId(), customerShares.get(0).id());
        assertTrue(service.listShares(session, null).isEmpty());
    }

    @Test
    void revokeIsOwnershipGuardedAndIdempotent() {
        WishlistShare share = share(customerId, null, "x");
        when(shareRepository.findByIdAndOwnerCustomerId(share.getId(), customerId)).thenReturn(Optional.of(share));
        UUID otherCustomer = UUID.randomUUID();
        when(shareRepository.findByIdAndOwnerCustomerId(share.getId(), otherCustomer)).thenReturn(Optional.empty());
        when(shareRepository.findGuestShare(share.getId(), session)).thenReturn(Optional.empty());

        NotFoundException foreign = assertThrows(NotFoundException.class,
                () -> service.revokeShare(null, otherCustomer, share.getId()));
        assertEquals("Wishlist share not found", foreign.getMessage());
        assertThrows(NotFoundException.class, () -> service.revokeShare(session, null, share.getId()));
        assertNull(share.getRevokedAt());

        service.revokeShare(null, customerId, share.getId());
        assertEquals(NOW, share.getRevokedAt());
        clock.set(NOW.plusSeconds(60));
        service.revokeShare(null, customerId, share.getId());
        assertEquals(NOW, share.getRevokedAt());
    }

    @Test
    void guestRevokeRequiresSameSession() {
        WishlistShare share = share(null, session, "x");
        when(shareRepository.findGuestShare(share.getId(), session)).thenReturn(Optional.of(share));
        when(shareRepository.findGuestShare(share.getId(), "other-session")).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class, () -> service.revokeShare("other-session", null, share.getId()));
        service.revokeShare(session, null, share.getId());
        assertNotNull(share.getRevokedAt());
    }

    @Test
    void publicViewExposesSnapshotAndReservationFlagOnly() {
        String token = token();
        WishlistShare share = share(customerId, null, token);
        WishlistShareItem item = item(share, "Smart TV");
        item.setReservationKeyHash(sha256(token()));
        item.setReservedAt(NOW);
        item(share, "Sofa");
        when(shareRepository.findByTokenHash(sha256(token))).thenReturn(Optional.of(share));

        PublicShareResponse view = service.getPublicShare(token);
        assertEquals(share.getExpiresAt(), view.expiresAt());
        assertEquals(2, view.items().size());
        assertTrue(view.items().get(0).reserved());
        assertFalse(view.items().get(1).reserved());
        assertTrue(view.items().stream().allMatch(i -> i.quantity() == 1));
    }

    @Test
    void expiryIsExclusiveAtExactInstantAndRevokedOrUnknownTokensAreGenericNotFound() {
        String token = token();
        WishlistShare share = share(customerId, null, token);
        when(shareRepository.findByTokenHash(sha256(token))).thenReturn(Optional.of(share));

        clock.set(share.getExpiresAt().minusMillis(1));
        assertNotNull(service.getPublicShare(token));

        clock.set(share.getExpiresAt());
        assertGenericNotFound(() -> service.getPublicShare(token));
        assertGenericNotFound(() -> service.reserveItem(token, UUID.randomUUID()));

        clock.set(NOW);
        share.setRevokedAt(NOW);
        assertGenericNotFound(() -> service.getPublicShare(token));
        assertGenericNotFound(() -> service.cancelReservation(token, UUID.randomUUID(), token()));

        assertGenericNotFound(() -> service.getPublicShare(token()));
        assertGenericNotFound(() -> service.getPublicShare("not-a-valid-token"));
        assertGenericNotFound(() -> service.getPublicShare(token + "x"));
        verify(itemRepository, never()).claim(any(), any(), any(), any());
        verify(itemRepository, never()).release(any(), any(), any(), any());
    }

    @Test
    void reserveReturnsOneTimeKeyAndPersistsOnlyItsHash() {
        String token = token();
        WishlistShare share = share(customerId, null, token);
        UUID itemId = UUID.randomUUID();
        when(shareRepository.findByTokenHash(sha256(token))).thenReturn(Optional.of(share));
        when(itemRepository.claim(eq(share.getId()), eq(itemId), anyString(), eq(NOW))).thenReturn(1);

        ReservationResponse reservation = service.reserveItem(token, itemId);

        assertTrue(reservation.cancellationKey().matches("^[A-Za-z0-9_-]{43}$"));
        ArgumentCaptor<String> hash = ArgumentCaptor.forClass(String.class);
        verify(itemRepository).claim(eq(share.getId()), eq(itemId), hash.capture(), eq(NOW));
        assertEquals(sha256(reservation.cancellationKey()), hash.getValue());
    }

    @Test
    void reserveAlreadyReservedItemConflictsAndForeignItemIsNotFound() {
        String token = token();
        WishlistShare share = share(customerId, null, token);
        UUID reservedItem = UUID.randomUUID();
        UUID foreignItem = UUID.randomUUID();
        when(shareRepository.findByTokenHash(sha256(token))).thenReturn(Optional.of(share));
        when(itemRepository.claim(any(), any(), anyString(), any())).thenReturn(0);
        when(itemRepository.existsByIdAndShareId(reservedItem, share.getId())).thenReturn(true);
        when(itemRepository.existsByIdAndShareId(foreignItem, share.getId())).thenReturn(false);

        ConflictException conflict = assertThrows(ConflictException.class, () -> service.reserveItem(token, reservedItem));
        assertEquals("This item has already been reserved", conflict.getMessage());
        assertGenericNotFound(() -> service.reserveItem(token, foreignItem));
    }

    @Test
    void concurrentClaimsForSameItemOnlyOneWins() throws Exception {
        String token = token();
        WishlistShare share = share(customerId, null, token);
        UUID itemId = UUID.randomUUID();
        AtomicReference<String> storedHash = new AtomicReference<>();
        when(shareRepository.findByTokenHash(sha256(token))).thenReturn(Optional.of(share));
        // Mirrors the conditional UPDATE ... WHERE reservation_key_hash IS NULL compare-and-set.
        when(itemRepository.claim(eq(share.getId()), eq(itemId), anyString(), any()))
                .thenAnswer(inv -> storedHash.compareAndSet(null, inv.getArgument(2)) ? 1 : 0);
        when(itemRepository.existsByIdAndShareId(itemId, share.getId())).thenReturn(true);

        int threads = 16;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<String>> results = new ArrayList<>();
        for (int i = 0; i < threads; i++) {
            Callable<String> claim = () -> {
                start.await();
                try {
                    return service.reserveItem(token, itemId).cancellationKey();
                } catch (ConflictException e) {
                    return null;
                }
            };
            results.add(pool.submit(claim));
        }
        start.countDown();
        Set<String> winners = new HashSet<>();
        for (Future<String> f : results) {
            String key = f.get();
            if (key != null) winners.add(key);
        }
        pool.shutdown();
        assertEquals(1, winners.size());
        assertEquals(sha256(winners.iterator().next()), storedHash.get());
    }

    @Test
    void cancelRequiresMatchingSecretKeyAndWrongKeyIsGenericNotFound() {
        String token = token();
        WishlistShare share = share(customerId, null, token);
        UUID itemId = UUID.randomUUID();
        String key = token();
        when(shareRepository.findByTokenHash(sha256(token))).thenReturn(Optional.of(share));
        when(itemRepository.release(share.getId(), itemId, sha256(key), NOW)).thenReturn(1);
        when(itemRepository.release(eq(share.getId()), eq(itemId), argThatNot(sha256(key)), any())).thenReturn(0);

        service.cancelReservation(token, itemId, key);
        assertGenericNotFound(() -> service.cancelReservation(token, itemId, token()));
        assertGenericNotFound(() -> service.cancelReservation(token, itemId, "short"));
        verify(itemRepository, times(2)).release(any(), any(), any(), any());
    }

    private static String argThatNot(String value) {
        return org.mockito.ArgumentMatchers.argThat(arg -> arg != null && !arg.equals(value));
    }

    private static void assertGenericNotFound(org.junit.jupiter.api.function.Executable call) {
        NotFoundException e = assertThrows(NotFoundException.class, call);
        assertEquals("Wishlist share not found", e.getMessage());
    }

    private WishlistShare share(UUID owner, String ownerSession, String token) {
        WishlistShare share = new WishlistShare();
        ReflectionTestUtils.setField(share, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(share, "createdAt", NOW);
        share.setOwnerCustomerId(owner);
        share.setOwnerSessionId(ownerSession);
        share.setTokenHash(sha256(token));
        share.setExpiresAt(NOW.plus(Duration.ofDays(30)));
        return share;
    }

    private static WishlistShareItem item(WishlistShare share, String name) {
        WishlistShareItem item = new WishlistShareItem();
        ReflectionTestUtils.setField(item, "id", UUID.randomUUID());
        item.setProductId(UUID.randomUUID());
        item.setProductName(name);
        share.addItem(item);
        return item;
    }

    private static Product product(String name) {
        Product p = new Product();
        ReflectionTestUtils.setField(p, "id", UUID.randomUUID());
        p.setName(name);
        return p;
    }

    private static ProductVariant variant(Product product, String name) {
        ProductVariant v = new ProductVariant();
        ReflectionTestUtils.setField(v, "id", UUID.randomUUID());
        v.setProduct(product);
        v.setVariantName(name);
        return v;
    }

    private static CustomerWishlistItem wish(Product product, ProductVariant variant, String notes) {
        CustomerWishlistItem w = new CustomerWishlistItem();
        w.setProduct(product);
        w.setProductVariant(variant);
        w.setNotes(notes);
        w.setAddedPrice(BigDecimal.valueOf(999));
        w.setCurrentPrice(BigDecimal.valueOf(1));
        return w;
    }

    private static String token() {
        byte[] bytes = new byte[32];
        new java.security.SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static final class MutableClock extends Clock {
        private volatile Instant instant;

        MutableClock(Instant instant) {
            this.instant = instant;
        }

        void set(Instant instant) {
            this.instant = instant;
        }

        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return instant; }
    }
}
