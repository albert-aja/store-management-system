package com.sms.storefront;

import com.sms.common.web.ConflictException;
import com.sms.common.web.GlobalExceptionHandler;
import com.sms.common.web.NotFoundException;
import com.sms.storefront.controller.PublicWishlistShareController;
import com.sms.storefront.controller.WishlistShareController;
import com.sms.storefront.dto.WishlistShareDto.CreatedShareResponse;
import com.sms.storefront.dto.WishlistShareDto.PublicShareItem;
import com.sms.storefront.dto.WishlistShareDto.PublicShareResponse;
import com.sms.storefront.dto.WishlistShareDto.ReservationResponse;
import com.sms.storefront.dto.WishlistShareDto.ShareSummaryResponse;
import com.sms.storefront.service.StorefrontAuthService;
import com.sms.storefront.service.WishlistShareService;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** HTTP contract and serialization privacy for wishlist shares. */
class WishlistShareControllerTest {

    private static final String TOKEN = "A".repeat(43);
    private final WishlistShareService service = mock(WishlistShareService.class);
    private final StorefrontAuthService authService = mock(StorefrontAuthService.class);
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(
                        new WishlistShareController(service, authService),
                        new PublicWishlistShareController(service))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();
    }

    @Test
    void createReturnsTokenOnceAndListNeverReturnsToken() throws Exception {
        UUID id = UUID.randomUUID();
        Instant created = Instant.parse("2026-10-31T10:00:00Z");
        when(service.createShare("guest-1", null))
                .thenReturn(new CreatedShareResponse(id, TOKEN, created, created.plusSeconds(2_592_000)));
        when(service.listShares("guest-1", null))
                .thenReturn(List.of(new ShareSummaryResponse(id, created, created.plusSeconds(2_592_000), null)));

        mvc.perform(post("/api/v1/storefront/wishlist/shares").header("X-Session-ID", "guest-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.*", hasSize(4)))
                .andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.token").value(TOKEN))
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.expiresAt").exists());

        mvc.perform(get("/api/v1/storefront/wishlist/shares").header("X-Session-ID", "guest-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].*", hasSize(4)))
                .andExpect(jsonPath("$[0].id").value(id.toString()))
                .andExpect(jsonPath("$[0].revokedAt").value(nullValue()))
                .andExpect(jsonPath("$[0].token").doesNotExist())
                .andExpect(content().string(not(containsString(TOKEN))))
                .andExpect(content().string(not(containsString("guest-1"))));
    }

    @Test
    void revokeOfForeignShareIsNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new NotFoundException("Wishlist share not found")).when(service).revokeShare("guest-2", null, id);
        mvc.perform(delete("/api/v1/storefront/wishlist/shares/" + id).header("X-Session-ID", "guest-2"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Wishlist share not found"));
        mvc.perform(delete("/api/v1/storefront/wishlist/shares/" + UUID.randomUUID()).header("X-Session-ID", "guest-1"))
                .andExpect(status().isOk());
    }

    @Test
    void publicShareSerializesOnlySnapshotFieldsWithoutPrivateData() throws Exception {
        UUID itemId = UUID.randomUUID();
        when(service.getPublicShare(TOKEN)).thenReturn(new PublicShareResponse(
                Instant.parse("2026-10-31T10:00:00Z"), Instant.parse("2026-11-30T10:00:00Z"),
                List.of(new PublicShareItem(itemId, UUID.randomUUID(), null, "Smart TV", null,
                        "https://img.example/tv.jpg", 1, true))));

        mvc.perform(get("/api/v1/storefront/wishlist/share/" + TOKEN))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(header().string("Referrer-Policy", "no-referrer"))
                .andExpect(header().string("X-Robots-Tag", "noindex, nofollow"))
                .andExpect(jsonPath("$.*", hasSize(3)))
                .andExpect(jsonPath("$.items[0].*", hasSize(8)))
                .andExpect(jsonPath("$.items[0].id").value(itemId.toString()))
                .andExpect(jsonPath("$.items[0].variantId").value(nullValue()))
                .andExpect(jsonPath("$.items[0].quantity").value(1))
                .andExpect(jsonPath("$.items[0].reserved").value(true))
                .andExpect(content().string(not(containsStringIgnoringCase("price"))))
                .andExpect(content().string(not(containsStringIgnoringCase("note"))))
                .andExpect(content().string(not(containsStringIgnoringCase("session"))))
                .andExpect(content().string(not(containsStringIgnoringCase("customer"))))
                .andExpect(content().string(not(containsStringIgnoringCase("owner"))))
                .andExpect(content().string(not(containsStringIgnoringCase("hash"))))
                .andExpect(content().string(not(containsStringIgnoringCase("token"))));
        verifyNoInteractions(authService);
    }

    @Test
    void unknownRevokedOrExpiredPublicShareIsGeneric404() throws Exception {
        when(service.getPublicShare(anyString())).thenThrow(new NotFoundException("Wishlist share not found"));
        mvc.perform(get("/api/v1/storefront/wishlist/share/whatever"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Wishlist share not found"));
    }

    @Test
    void reservationReturnsOnlyCancellationKeyAndConflictsAre409() throws Exception {
        UUID itemId = UUID.randomUUID();
        String key = "K".repeat(43);
        when(service.reserveItem(TOKEN, itemId)).thenReturn(new ReservationResponse(key));
        UUID taken = UUID.randomUUID();
        when(service.reserveItem(TOKEN, taken)).thenThrow(new ConflictException("This item has already been reserved"));

        mvc.perform(post("/api/v1/storefront/wishlist/share/" + TOKEN + "/items/" + itemId + "/reservation"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(header().string("X-Robots-Tag", "noindex, nofollow"))
                .andExpect(jsonPath("$.*", hasSize(1)))
                .andExpect(jsonPath("$.cancellationKey").value(key));
        mvc.perform(post("/api/v1/storefront/wishlist/share/" + TOKEN + "/items/" + taken + "/reservation"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("This item has already been reserved"));
    }

    @Test
    void cancelRequiresKeyBodyAndWrongKeyIsNotFound() throws Exception {
        UUID itemId = UUID.randomUUID();
        String good = "G".repeat(43);
        String bad = "B".repeat(43);
        doThrow(new NotFoundException("Wishlist share not found")).when(service).cancelReservation(TOKEN, itemId, bad);
        String url = "/api/v1/storefront/wishlist/share/" + TOKEN + "/items/" + itemId + "/reservation";

        mvc.perform(delete(url).contentType(MediaType.APPLICATION_JSON).content("{\"cancellationKey\":\"" + good + "\"}"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(header().string("Referrer-Policy", "no-referrer"))
                .andExpect(header().string("X-Robots-Tag", "noindex, nofollow"));
        verify(service).cancelReservation(TOKEN, itemId, good);
        mvc.perform(delete(url).contentType(MediaType.APPLICATION_JSON).content("{\"cancellationKey\":\"" + bad + "\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(delete(url).contentType(MediaType.APPLICATION_JSON).content("{\"cancellationKey\":\"\"}"))
                .andExpect(status().isBadRequest());
        verify(service, never()).cancelReservation(eq(TOKEN), eq(itemId), eq(""));
        verify(service, times(2)).cancelReservation(any(), any(), any());
    }
}
