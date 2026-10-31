package com.sms.storefront;

import com.sms.inventory.StockAvailability;
import com.sms.inventory.StockUnitRepository;
import com.sms.pricing.StoreProductPrice;
import com.sms.pricing.StoreProductPriceRepository;
import com.sms.product.dto.Product;
import com.sms.product.dto.ProductCategory;
import com.sms.product.dto.ProductVariant;
import com.sms.product.repository.ProductRepository;
import com.sms.product.repository.ProductVariantRepository;
import com.sms.storefront.dto.AddToCartRequest;
import com.sms.storefront.dto.StorefrontCartDto;
import com.sms.storefront.dto.StorefrontWishlistDto.*;
import com.sms.storefront.model.CustomerWishlistItem;
import com.sms.storefront.model.StorefrontCustomer;
import com.sms.storefront.repository.CustomerWishlistItemRepository;
import com.sms.storefront.repository.StorefrontCustomerRepository;
import com.sms.storefront.service.StorefrontCartService;
import com.sms.storefront.service.StorefrontPushNotificationService;
import com.sms.storefront.service.StorefrontWishlistService;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StorefrontWishlistServiceTest {

    @Mock
    private CustomerWishlistItemRepository wishlistRepository;

    @Mock
    private ProductVariantRepository productVariantRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private StoreProductPriceRepository priceRepository;

    @Mock
    private StockUnitRepository stockUnitRepository;

    @Mock
    private StorefrontCustomerRepository customerRepository;

    @Mock
    private StorefrontCartService cartService;

    @Mock
    private StorefrontPushNotificationService pushService;

    @InjectMocks
    private StorefrontWishlistService wishlistService;

    private Product tvProduct;
    private ProductVariant tvVariant;
    private StorefrontCustomer testCustomer;
    private String sessionId = "session_test_xyz";

    @BeforeEach
    void setUp() {
        ProductCategory cat = new ProductCategory();
        cat.setName("Smart TV & Audio");

        tvProduct = new Product();
        ReflectionTestUtils.setField(tvProduct, "id", UUID.randomUUID());
        tvProduct.setName("Samsung 55\" Crystal UHD 4K Smart TV");
        tvProduct.setCode("SAM-TV-55");
        tvProduct.setCategory(cat);

        tvVariant = new ProductVariant();
        ReflectionTestUtils.setField(tvVariant, "id", UUID.randomUUID());
        tvVariant.setProduct(tvProduct);
        tvVariant.setVariantName("Black Edition 4K");
        tvVariant.setSku("SAM-TV-55-BLK");

        testCustomer = new StorefrontCustomer();
        ReflectionTestUtils.setField(testCustomer, "id", UUID.randomUUID());
        testCustomer.setEmail("customer@smsmart.co.id");
        testCustomer.setFullName("Budi Santoso");
    }

    @Test
    void rejectsAnotherCustomersWishlistAndPreservesGuestScope() {
        CustomerWishlistItem item = new CustomerWishlistItem();
        UUID itemId = UUID.randomUUID();
        item.setCustomer(testCustomer);
        item.setSessionId(sessionId);
        when(wishlistRepository.findById(itemId)).thenReturn(Optional.of(item));
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> wishlistService.checkOwnership(sessionId, UUID.randomUUID(), itemId));
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> wishlistService.checkOwnership(sessionId, null, itemId));
        assertDoesNotThrow(() -> wishlistService.checkOwnership(sessionId, testCustomer.getId(), itemId));
        item.setCustomer(null);
        assertDoesNotThrow(() -> wishlistService.checkOwnership(sessionId, null, itemId));
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> wishlistService.checkOwnership("other-session", null, itemId));
    }

    @Test
    void testAddToWishlist_Success() {
        when(productVariantRepository.findById(tvVariant.getId())).thenReturn(Optional.of(tvVariant));
        when(wishlistRepository.findBySessionIdAndProductId(eq(sessionId), eq(tvProduct.getId()))).thenReturn(Optional.empty());

        when(wishlistRepository.save(any(CustomerWishlistItem.class))).thenAnswer(invocation -> {
            CustomerWishlistItem item = invocation.getArgument(0);
            ReflectionTestUtils.setField(item, "id", UUID.randomUUID());
            return item;
        });

        AddToWishlistRequest request = new AddToWishlistRequest(
                tvProduct.getId(),
                tvVariant.getId(),
                BigDecimal.valueOf(7000000),
                "Impian ruang keluarga"
        );

        WishlistItemDto dto = wishlistService.addToWishlist(sessionId, null, request);

        assertNotNull(dto);
        assertEquals(tvProduct.getId(), dto.productId());
        assertEquals("Impian ruang keluarga", dto.notes());
        assertEquals(BigDecimal.valueOf(7000000), dto.originalAddedPrice());
        verify(wishlistRepository, times(1)).save(any(CustomerWishlistItem.class));
    }

    @Test
    void testGetWishlist_CalculatesPriceDropCorrectly() {
        CustomerWishlistItem item = new CustomerWishlistItem();
        ReflectionTestUtils.setField(item, "id", UUID.randomUUID());
        item.setProduct(tvProduct);
        item.setProductVariant(tvVariant);
        item.setSessionId(sessionId);
        item.setAddedPrice(BigDecimal.valueOf(7500000)); // Added when price was 7,500,000
        item.setCurrentPrice(BigDecimal.valueOf(6750000)); // Current price dropped to 6,750,000 (10% drop, 750,000 savings)

        when(wishlistRepository.findBySessionIdOrderByCreatedAtDesc(sessionId)).thenReturn(List.of(item));
        when(stockUnitRepository.countByProductVariantIdAndAvailabilityStatus(tvVariant.getId(), StockAvailability.AVAILABLE))
                .thenReturn(5L);

        WishlistSummaryDto summary = wishlistService.getWishlist(sessionId, null);

        assertNotNull(summary);
        assertEquals(1, summary.totalItems());
        assertEquals(1, summary.priceDropCount());
        assertEquals(BigDecimal.valueOf(750000), summary.totalPotentialSavings());

        WishlistItemDto firstItem = summary.items().get(0);
        assertTrue(firstItem.hasPriceDrop());
        assertEquals(BigDecimal.valueOf(750000), firstItem.priceDropAmount());
        assertEquals(10.0, firstItem.priceDropPercentage(), 0.01);
        assertEquals("IN_STOCK", firstItem.commercialAvailability());
    }

    @Test
    void testMoveToCart_AddsToCartAndDeletesFromWishlist() {
        UUID itemId = UUID.randomUUID();
        CustomerWishlistItem item = new CustomerWishlistItem();
        ReflectionTestUtils.setField(item, "id", itemId);
        item.setProduct(tvProduct);
        item.setProductVariant(tvVariant);
        item.setSessionId(sessionId);

        when(wishlistRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(cartService.addItem(eq(sessionId), any(AddToCartRequest.class))).thenReturn(new StorefrontCartDto(
                UUID.randomUUID(), new ArrayList<>(), 1, BigDecimal.valueOf(7000000), BigDecimal.valueOf(770000), BigDecimal.valueOf(7770000)
        ));

        StorefrontCartDto updatedCart = wishlistService.moveToCart(sessionId, null, itemId);

        assertNotNull(updatedCart);
        verify(cartService, times(1)).addItem(eq(sessionId), any(AddToCartRequest.class));
        verify(wishlistRepository, times(1)).delete(item);
    }

    @Test
    void testSyncWishlist_MergesGuestItemsToCustomer() {
        UUID customerId = testCustomer.getId();
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(testCustomer));

        CustomerWishlistItem guestItem = new CustomerWishlistItem();
        ReflectionTestUtils.setField(guestItem, "id", UUID.randomUUID());
        guestItem.setProduct(tvProduct);
        guestItem.setProductVariant(tvVariant);
        guestItem.setSessionId(sessionId);
        guestItem.setAddedPrice(BigDecimal.valueOf(7000000));
        guestItem.setCurrentPrice(BigDecimal.valueOf(7000000));

        when(wishlistRepository.findBySessionIdOrderByCreatedAtDesc(sessionId)).thenReturn(List.of(guestItem));
        when(wishlistRepository.findByCustomerIdAndProductId(customerId, tvProduct.getId())).thenReturn(Optional.empty());
        when(wishlistRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)).thenReturn(List.of(guestItem));

        WishlistSummaryDto result = wishlistService.syncWishlist(sessionId, customerId);

        assertNotNull(result);
        assertEquals(testCustomer, guestItem.getCustomer());
        assertNull(guestItem.getSessionId());
        verify(wishlistRepository, times(1)).save(guestItem);
    }

    @Test
    void testSimulatePriceDrop_TriggersDiscountAndRecalculates() {
        UUID itemId = UUID.randomUUID();
        CustomerWishlistItem item = new CustomerWishlistItem();
        ReflectionTestUtils.setField(item, "id", itemId);
        item.setProduct(tvProduct);
        item.setProductVariant(tvVariant);
        item.setSessionId(sessionId);
        item.setAddedPrice(BigDecimal.valueOf(10000000));
        item.setCurrentPrice(BigDecimal.valueOf(10000000));

        when(wishlistRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(wishlistRepository.findBySessionIdOrderByCreatedAtDesc(sessionId)).thenReturn(List.of(item));

        // Drop price to 8,000,000 (20% drop)
        WishlistItemDto updated = wishlistService.simulatePriceDrop(itemId, BigDecimal.valueOf(8000000));

        assertNotNull(updated);
        assertTrue(updated.hasPriceDrop());
        assertEquals(BigDecimal.valueOf(2000000), updated.priceDropAmount());
        assertEquals(20.0, updated.priceDropPercentage(), 0.01);
        verify(wishlistRepository, times(1)).save(item);
    }
}
