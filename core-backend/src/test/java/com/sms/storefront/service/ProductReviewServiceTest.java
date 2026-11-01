package com.sms.storefront.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sms.customer.Customer;
import com.sms.delivery.DeliveryOrder;
import com.sms.delivery.DeliveryOrderRepository;
import com.sms.delivery.DeliveryOrderStatus;
import com.sms.product.dto.Product;
import com.sms.product.dto.ProductVariant;
import com.sms.product.repository.ProductRepository;
import com.sms.product.repository.ProductVariantRepository;
import com.sms.sales.SalesOrder;
import com.sms.sales.SalesOrderItem;
import com.sms.sales.SalesOrderItemRepository;
import com.sms.sales.SalesOrderRepository;
import com.sms.sales.SalesOrderStatus;
import com.sms.storefront.dto.ProductReviewDto.*;
import com.sms.storefront.model.ProductReview;
import com.sms.storefront.model.StorefrontCustomer;
import com.sms.storefront.repository.ProductReviewRepository;
import com.sms.storefront.repository.StorefrontCustomerRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class ProductReviewServiceTest {

    @Mock
    private ProductReviewRepository reviewRepository;

    @Mock
    private StorefrontCustomerRepository customerRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductVariantRepository productVariantRepository;

    @Mock
    private SalesOrderRepository salesOrderRepository;

    @Mock
    private SalesOrderItemRepository salesOrderItemRepository;

    @Mock
    private DeliveryOrderRepository deliveryOrderRepository;

    @InjectMocks
    private ProductReviewService reviewService;

    private UUID customerId;
    private UUID masterCustomerId;
    private UUID productId;
    private UUID variantId;
    private StorefrontCustomer storefrontCustomer;
    private Customer masterCustomer;
    private Product product;
    private ProductVariant variant;

    private void setId(Object entity, UUID id) {
        ReflectionTestUtils.setField(entity, "id", id);
    }

    private void setCreatedAt(Object entity, Instant instant) {
        ReflectionTestUtils.setField(entity, "createdAt", instant);
    }

    @BeforeEach
    void setUp() {
        customerId = UUID.randomUUID();
        masterCustomerId = UUID.randomUUID();
        productId = UUID.randomUUID();
        variantId = UUID.randomUUID();

        masterCustomer = new Customer();
        setId(masterCustomer, masterCustomerId);
        masterCustomer.setFullName("Budi Santoso");

        storefrontCustomer = new StorefrontCustomer();
        setId(storefrontCustomer, customerId);
        storefrontCustomer.setFullName("Budi Santoso");
        storefrontCustomer.setCustomer(masterCustomer);

        product = new Product();
        setId(product, productId);
        product.setName("Smart TV 55 Inch");

        variant = new ProductVariant();
        setId(variant, variantId);
        variant.setProduct(product);
        variant.setVariantName("Black Edition");
    }

    @Test
    @DisplayName("getProductReviews: aggregates ratings, breakdown distribution, and masks customer names")
    void getProductReviews_success() {
        ProductReview r1 = new ProductReview();
        setId(r1, UUID.randomUUID());
        r1.setCustomer(storefrontCustomer);
        r1.setRating(5);
        r1.setTitle("Layar sangat jernih!");
        r1.setContent("Pengiriman cepat dan packaging sangat rapi.");
        r1.setVerifiedPurchase(true);
        setCreatedAt(r1, Instant.now());

        StorefrontCustomer sc2 = new StorefrontCustomer();
        setId(sc2, UUID.randomUUID());
        sc2.setFullName("Siti Aminah");
        ProductReview r2 = new ProductReview();
        setId(r2, UUID.randomUUID());
        r2.setCustomer(sc2);
        r2.setRating(4);
        r2.setTitle("Bagus dan elegan");
        r2.setContent("Suara mantap, fitur lengkap.");
        r2.setVerifiedPurchase(true);
        setCreatedAt(r2, Instant.now());

        when(reviewRepository.findByProductIdOrderByCreatedAtDesc(productId)).thenReturn(List.of(r1, r2));

        ProductReviewSummaryDto summary = reviewService.getProductReviews(productId);

        assertThat(summary.totalReviews()).isEqualTo(2);
        assertThat(summary.averageRating()).isEqualTo(4.5);
        assertThat(summary.distribution().stars5()).isEqualTo(1);
        assertThat(summary.distribution().stars4()).isEqualTo(1);
        assertThat(summary.distribution().stars3()).isEqualTo(0);
        assertThat(summary.reviews()).hasSize(2);
        assertThat(summary.reviews().get(0).customerName()).isEqualTo("Budi S.");
        assertThat(summary.reviews().get(1).customerName()).isEqualTo("Siti A.");
        assertThat(summary.reviews().get(0).verifiedPurchase()).isTrue();
    }

    @Test
    @DisplayName("checkEligibility: strictly blocked when no purchase order exists")
    void checkEligibility_noPurchaseFound() {
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(storefrontCustomer));
        when(reviewRepository.findByCustomerIdAndProductId(customerId, productId)).thenReturn(Optional.empty());
        when(salesOrderRepository.search(null, masterCustomerId, null)).thenReturn(List.of());

        ReviewEligibilityDto eligibility = reviewService.checkEligibility(customerId, productId);

        assertThat(eligibility.eligible()).isFalse();
        assertThat(eligibility.reason()).isEqualTo("NO_PURCHASE_FOUND");
    }

    @Test
    @DisplayName("checkEligibility: blocked with DELIVERY_PENDING when order in transit / not yet delivered")
    void checkEligibility_deliveryPending() {
        SalesOrder order = new SalesOrder();
        setId(order, UUID.randomUUID());
        order.setNumber("SO-20261101-001");
        order.setStatus(SalesOrderStatus.CONFIRMED);

        SalesOrderItem item = new SalesOrderItem();
        item.setProductVariant(variant);

        DeliveryOrder deliveryOrder = new DeliveryOrder();
        setId(deliveryOrder, UUID.randomUUID());
        deliveryOrder.setStatus(DeliveryOrderStatus.IN_TRANSIT);

        when(customerRepository.findById(customerId)).thenReturn(Optional.of(storefrontCustomer));
        when(reviewRepository.findByCustomerIdAndProductId(customerId, productId)).thenReturn(Optional.empty());
        when(salesOrderRepository.search(null, masterCustomerId, null)).thenReturn(List.of(order));
        when(salesOrderItemRepository.findBySalesOrderId(order.getId())).thenReturn(List.of(item));
        when(deliveryOrderRepository.findBySalesOrderIdOrderByCreatedAtDesc(order.getId())).thenReturn(List.of(deliveryOrder));

        ReviewEligibilityDto eligibility = reviewService.checkEligibility(customerId, productId);

        assertThat(eligibility.eligible()).isFalse();
        assertThat(eligibility.reason()).isEqualTo("DELIVERY_PENDING");
        assertThat(eligibility.orderNumber()).isEqualTo("SO-20261101-001");
    }

    @Test
    @DisplayName("checkEligibility: eligible when DeliveryOrder status is DELIVERED")
    void checkEligibility_deliveryConfirmed() {
        SalesOrder order = new SalesOrder();
        setId(order, UUID.randomUUID());
        order.setNumber("SO-20261101-002");
        order.setStatus(SalesOrderStatus.CONFIRMED);

        SalesOrderItem item = new SalesOrderItem();
        item.setProductVariant(variant);

        DeliveryOrder deliveryOrder = new DeliveryOrder();
        setId(deliveryOrder, UUID.randomUUID());
        deliveryOrder.setStatus(DeliveryOrderStatus.DELIVERED);

        when(customerRepository.findById(customerId)).thenReturn(Optional.of(storefrontCustomer));
        when(reviewRepository.findByCustomerIdAndProductId(customerId, productId)).thenReturn(Optional.empty());
        when(salesOrderRepository.search(null, masterCustomerId, null)).thenReturn(List.of(order));
        when(salesOrderItemRepository.findBySalesOrderId(order.getId())).thenReturn(List.of(item));
        when(deliveryOrderRepository.findBySalesOrderIdOrderByCreatedAtDesc(order.getId())).thenReturn(List.of(deliveryOrder));

        ReviewEligibilityDto eligibility = reviewService.checkEligibility(customerId, productId);

        assertThat(eligibility.eligible()).isTrue();
        assertThat(eligibility.orderNumber()).isEqualTo("SO-20261101-002");
        assertThat(eligibility.reason()).isNull();
    }

    @Test
    @DisplayName("submitReview: throws 403 Forbidden if delivery is not confirmed")
    void submitReview_forbiddenWhenInTransit() {
        SalesOrder order = new SalesOrder();
        setId(order, UUID.randomUUID());
        order.setStatus(SalesOrderStatus.CONFIRMED);

        SalesOrderItem item = new SalesOrderItem();
        item.setProductVariant(variant);

        DeliveryOrder deliveryOrder = new DeliveryOrder();
        setId(deliveryOrder, UUID.randomUUID());
        deliveryOrder.setStatus(DeliveryOrderStatus.IN_TRANSIT);

        when(customerRepository.findById(customerId)).thenReturn(Optional.of(storefrontCustomer));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(salesOrderRepository.search(null, masterCustomerId, null)).thenReturn(List.of(order));
        when(salesOrderItemRepository.findBySalesOrderId(order.getId())).thenReturn(List.of(item));
        when(deliveryOrderRepository.findBySalesOrderIdOrderByCreatedAtDesc(order.getId())).thenReturn(List.of(deliveryOrder));

        SubmitReviewRequest request = new SubmitReviewRequest(productId, variantId, 5, "Mantap", "Sudah dicoba mantap");

        assertThatThrownBy(() -> reviewService.submitReview(customerId, request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Barang masih dalam proses pengiriman");
    }

    @Test
    @DisplayName("submitReview: success when delivery order is DELIVERED")
    void submitReview_successDelivered() {
        SalesOrder order = new SalesOrder();
        setId(order, UUID.randomUUID());
        order.setNumber("SO-DELIV-999");
        order.setStatus(SalesOrderStatus.CONFIRMED);

        SalesOrderItem item = new SalesOrderItem();
        item.setProductVariant(variant);

        DeliveryOrder deliveryOrder = new DeliveryOrder();
        setId(deliveryOrder, UUID.randomUUID());
        deliveryOrder.setStatus(DeliveryOrderStatus.DELIVERED);

        when(customerRepository.findById(customerId)).thenReturn(Optional.of(storefrontCustomer));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productVariantRepository.findById(variantId)).thenReturn(Optional.of(variant));
        when(salesOrderRepository.search(null, masterCustomerId, null)).thenReturn(List.of(order));
        when(salesOrderItemRepository.findBySalesOrderId(order.getId())).thenReturn(List.of(item));
        when(deliveryOrderRepository.findBySalesOrderIdOrderByCreatedAtDesc(order.getId())).thenReturn(List.of(deliveryOrder));
        when(reviewRepository.findByCustomerIdAndProductId(customerId, productId)).thenReturn(Optional.empty());

        when(reviewRepository.save(any(ProductReview.class))).thenAnswer(invocation -> {
            ProductReview pr = invocation.getArgument(0);
            setId(pr, UUID.randomUUID());
            setCreatedAt(pr, Instant.now());
            return pr;
        });

        SubmitReviewRequest request = new SubmitReviewRequest(productId, variantId, 5, "Sangat Puas", "Barang sampai dengan aman dan berfungsi prima.");

        ProductReviewItemDto result = reviewService.submitReview(customerId, request);

        assertThat(result.rating()).isEqualTo(5);
        assertThat(result.title()).isEqualTo("Sangat Puas");
        assertThat(result.verifiedPurchase()).isTrue();
        assertThat(result.customerName()).isEqualTo("Budi S.");
        verify(reviewRepository).save(any(ProductReview.class));
    }
}
