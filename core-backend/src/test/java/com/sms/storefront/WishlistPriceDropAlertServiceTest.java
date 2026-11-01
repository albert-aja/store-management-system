package com.sms.storefront;

import com.sms.product.dto.Product;
import com.sms.product.dto.ProductCategory;
import com.sms.product.dto.ProductVariant;
import com.sms.storefront.dto.StorefrontNotificationDto;
import com.sms.storefront.dto.StorefrontWishlistDto.PriceDropScanResultDto;
import com.sms.storefront.model.CustomerWishlistItem;
import com.sms.storefront.model.StorefrontCustomer;
import com.sms.storefront.model.WishlistPriceDropAlertLog;
import com.sms.storefront.repository.CustomerWishlistItemRepository;
import com.sms.storefront.repository.WishlistPriceDropAlertLogRepository;
import com.sms.storefront.service.StorefrontPushNotificationService;
import com.sms.storefront.service.WishlistPriceDropAlertService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
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
class WishlistPriceDropAlertServiceTest {

    @Mock
    private CustomerWishlistItemRepository wishlistRepository;

    @Mock
    private WishlistPriceDropAlertLogRepository alertLogRepository;

    @Mock
    private StorefrontPushNotificationService pushNotificationService;

    @InjectMocks
    private WishlistPriceDropAlertService alertService;

    private StorefrontCustomer customer;
    private Product product;
    private CustomerWishlistItem wishlistItem;

    @BeforeEach
    void setUp() {
        customer = new StorefrontCustomer();
        ReflectionTestUtils.setField(customer, "id", UUID.randomUUID());
        customer.setFullName("Siti Rahma");
        customer.setEmail("siti.rahma@gmail.com");
        customer.setPhone("081234567899");
        customer.setActive(true);

        ProductCategory category = new ProductCategory();
        category.setName("Electronics");

        product = new Product();
        ReflectionTestUtils.setField(product, "id", UUID.randomUUID());
        product.setName("Smart TV 55 Inch UHD");
        product.setCategory(category);

        ProductVariant variant = new ProductVariant();
        ReflectionTestUtils.setField(variant, "id", UUID.randomUUID());
        variant.setVariantName("Black Edition");
        variant.setSku("TV-55-BLK");

        wishlistItem = new CustomerWishlistItem();
        ReflectionTestUtils.setField(wishlistItem, "id", UUID.randomUUID());
        wishlistItem.setCustomer(customer);
        wishlistItem.setProduct(product);
        wishlistItem.setProductVariant(variant);
        wishlistItem.setAddedPrice(new BigDecimal("5000000.00"));
        wishlistItem.setCurrentPrice(new BigDecimal("5000000.00"));
        wishlistItem.setNotifyOnPriceDrop(true);
        wishlistItem.setAlertDropThresholdPercent(new BigDecimal("10.00")); // User chose 10% minimum drop
    }

    @Test
    void scanAndDispatch_noAlertWhenDropBelowUserThreshold() {
        // Price drops from 5.0M to 4.7M (6% drop, but user chose 10% threshold)
        wishlistItem.setCurrentPrice(new BigDecimal("4700000.00"));

        when(wishlistRepository.findActivePriceDropWatchers()).thenReturn(List.of(wishlistItem));

        PriceDropScanResultDto result = alertService.scanAndDispatchPriceDropAlerts();

        assertEquals(1, result.scannedCount());
        assertEquals(0, result.alertsTriggered(), "Drop of 6% should not trigger alert when threshold is 10%");
        verify(pushNotificationService, never()).sendMilestoneNotification(any(), any(), any(), any(), any());
        verify(alertLogRepository, never()).save(any());
    }

    @Test
    void scanAndDispatch_triggersAlertWhenDropMeetsOrExceedsThreshold() {
        // Price drops from 5.0M to 4.4M (12% drop >= 10% threshold)
        wishlistItem.setCurrentPrice(new BigDecimal("4400000.00"));

        when(wishlistRepository.findActivePriceDropWatchers()).thenReturn(List.of(wishlistItem));
        when(alertLogRepository.save(any(WishlistPriceDropAlertLog.class))).thenAnswer(invocation -> {
            WishlistPriceDropAlertLog l = invocation.getArgument(0);
            ReflectionTestUtils.setField(l, "id", UUID.randomUUID());
            return l;
        });

        PriceDropScanResultDto result = alertService.scanAndDispatchPriceDropAlerts();

        assertEquals(1, result.scannedCount());
        assertEquals(1, result.alertsTriggered());
        assertEquals(1, result.pushSentCount());
        assertEquals(1, result.emailSentCount());

        verify(pushNotificationService, times(1)).sendMilestoneNotification(
                contains("WISHLIST"),
                eq("WISHLIST_PRICE_DROP"),
                contains("Harga Wishlist Turun"),
                contains("Smart TV 55 Inch UHD"),
                any()
        );

        verify(alertLogRepository, times(1)).save(any(WishlistPriceDropAlertLog.class));
        assertEquals(new BigDecimal("4400000.00"), wishlistItem.getLastAlertedPrice());
        assertNotNull(wishlistItem.getLastAlertedAt());
    }

    @Test
    void scanAndDispatch_suppressesDuplicateAlertsOnSamePrice() {
        // Already alerted at 4.4M
        wishlistItem.setCurrentPrice(new BigDecimal("4400000.00"));
        wishlistItem.setLastAlertedPrice(new BigDecimal("4400000.00"));
        wishlistItem.setLastAlertedAt(Instant.now().minusSeconds(86400));

        when(wishlistRepository.findActivePriceDropWatchers()).thenReturn(List.of(wishlistItem));

        PriceDropScanResultDto result = alertService.scanAndDispatchPriceDropAlerts();

        assertEquals(1, result.scannedCount());
        assertEquals(0, result.alertsTriggered(), "Should not alert again if price remains identical to last alerted price");
        verify(pushNotificationService, never()).sendMilestoneNotification(any(), any(), any(), any(), any());
    }
}

