package com.sms.storefront;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.sms.customer.Customer;
import com.sms.customer.CustomerAddress;
import com.sms.customer.CustomerAddressRepository;
import com.sms.customer.CustomerRepository;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import com.sms.inventory.StockAvailability;
import com.sms.inventory.StockUnitRepository;
import com.sms.pricing.StoreProductPriceRepository;
import com.sms.product.dto.Product;
import com.sms.product.dto.ProductCategory;
import com.sms.product.dto.ProductVariant;
import com.sms.product.repository.ProductBrandRepository;
import com.sms.product.repository.ProductCategoryRepository;
import com.sms.product.repository.ProductRepository;
import com.sms.product.repository.ProductVariantRepository;
import com.sms.sales.SalesOrder;
import com.sms.sales.SalesOrderItem;
import com.sms.sales.SalesOrderItemRepository;
import com.sms.sales.SalesOrderRepository;
import com.sms.storefront.dto.AddToCartRequest;
import com.sms.storefront.dto.CheckoutRequest;
import com.sms.storefront.dto.CheckoutResponse;
import com.sms.storefront.dto.StorefrontCartDto;
import com.sms.storefront.dto.StorefrontOrderDto;
import com.sms.storefront.dto.StorefrontProductSummaryDto;
import com.sms.storefront.model.CustomerCart;
import com.sms.storefront.model.CustomerCartItem;
import com.sms.storefront.model.FulfillmentGroup;
import com.sms.storefront.model.FulfillmentGroupItem;
import com.sms.storefront.repository.CustomerCartItemRepository;
import com.sms.storefront.repository.CustomerCartRepository;
import com.sms.storefront.repository.FulfillmentGroupItemRepository;
import com.sms.storefront.repository.FulfillmentGroupRepository;
import com.sms.storefront.repository.StorefrontPaymentMethodRepository;
import com.sms.storefront.service.StorefrontCartService;
import com.sms.storefront.service.StorefrontCatalogService;
import com.sms.storefront.service.StorefrontCheckoutService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class StorefrontServiceTest {

    @Mock private ProductRepository productRepository;
    @Mock private ProductVariantRepository productVariantRepository;
    @Mock private ProductCategoryRepository categoryRepository;
    @Mock private ProductBrandRepository brandRepository;
    @Mock private StoreProductPriceRepository priceRepository;
    @Mock private StockUnitRepository stockUnitRepository;
    @Mock private SalesOrderRepository salesOrderRepository;
    @Mock private SalesOrderItemRepository salesOrderItemRepository;
    @Mock private FulfillmentGroupRepository fulfillmentGroupRepository;
    @Mock private FulfillmentGroupItemRepository fulfillmentGroupItemRepository;
    @Mock private StorefrontPaymentMethodRepository paymentMethodRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private CustomerAddressRepository customerAddressRepository;
    @Mock private StoreRepository storeRepository;
    @Mock private CustomerCartRepository cartRepository;
    @Mock private CustomerCartItemRepository cartItemRepository;
    @Mock private com.sms.storefront.service.StorefrontPushNotificationService pushNotificationService;
    @Mock private com.sms.pricing.PriceDiscountService discountService;

    private StorefrontCatalogService catalogService;
    private StorefrontCartService cartService;
    private StorefrontCheckoutService checkoutService;

    private Store testStore;
    private Product testProduct;
    private ProductVariant inStockVariant;
    private ProductVariant indentVariant;

    @BeforeEach
    void setUp() {
        org.mockito.Mockito.lenient().when(discountService.calculateDiscount(any(), any(), any(), any(), org.mockito.ArgumentMatchers.anyInt()))
                .thenAnswer(inv -> com.sms.pricing.dto.DiscountCalculationResult.noDiscount(inv.getArgument(3)));
        org.mockito.Mockito.lenient().when(discountService.calculateCartDiscount(any(), any()))
                .thenReturn(com.sms.pricing.dto.CartDiscountResult.none());

        catalogService = new StorefrontCatalogService(
                productRepository, productVariantRepository, categoryRepository,
                brandRepository, priceRepository, stockUnitRepository, discountService
        );
        cartService = new StorefrontCartService(
                cartRepository, cartItemRepository, productVariantRepository,
                priceRepository, stockUnitRepository, discountService
        );
        checkoutService = new StorefrontCheckoutService(
                salesOrderRepository, salesOrderItemRepository, fulfillmentGroupRepository,
                fulfillmentGroupItemRepository, paymentMethodRepository, customerRepository,
                customerAddressRepository, storeRepository, productVariantRepository,
                priceRepository, stockUnitRepository, pushNotificationService, discountService
        );

        testStore = new Store();
        testStore.setCode("STR-01");
        testStore.setName("Central Showroom");
        ReflectionTestUtils.setField(testStore, "id", UUID.randomUUID());

        ProductCategory cat = new ProductCategory();
        cat.setName("Electronics");
        ReflectionTestUtils.setField(cat, "id", UUID.randomUUID());

        testProduct = new Product();
        testProduct.setName("Samsung Smart TV 55 Inch");
        testProduct.setCode("PRD-TV-55");
        testProduct.setCategory(cat);
        ReflectionTestUtils.setField(testProduct, "id", UUID.randomUUID());

        inStockVariant = new ProductVariant();
        inStockVariant.setProduct(testProduct);
        inStockVariant.setVariantName("Black - Ready Stock");
        inStockVariant.setSku("SKU-TV-BLK");
        ReflectionTestUtils.setField(inStockVariant, "id", UUID.randomUUID());

        indentVariant = new ProductVariant();
        indentVariant.setProduct(testProduct);
        indentVariant.setVariantName("Silver - Indent Distributor");
        indentVariant.setSku("SKU-TV-SLV");
        ReflectionTestUtils.setField(indentVariant, "id", UUID.randomUUID());
    }

    @Test
    void testCatalogAvailabilityDecoupling() {
        when(productRepository.search(any())).thenReturn(List.of(testProduct));
        when(productVariantRepository.findByProductIdOrderByVariantName(testProduct.getId()))
                .thenReturn(List.of(inStockVariant, indentVariant));

        // In-stock variant has 5 physical units available
        when(stockUnitRepository.countByProductVariantIdAndAvailabilityStatus(
                inStockVariant.getId(), StockAvailability.AVAILABLE)).thenReturn(5L);
        // Indent variant has 0 physical units available
        when(stockUnitRepository.countByProductVariantIdAndAvailabilityStatus(
                indentVariant.getId(), StockAvailability.AVAILABLE)).thenReturn(0L);

        List<StorefrontProductSummaryDto> products = catalogService.getProducts(null, null, null, null, null, null);

        assertThat(products).hasSize(1);
        StorefrontProductSummaryDto dto = products.get(0);
        assertThat(dto.name()).isEqualTo("Samsung Smart TV 55 Inch");
        assertThat(dto.commercialAvailability()).isEqualTo("IN_STOCK");
        assertThat(dto.inStockCount()).isEqualTo(5L);
        assertThat(dto.leadTimeDays()).isEqualTo(1);
    }

    @Test
    void testDualAxisFulfillmentPartialSplit() {
        // Mock store and variants
        when(storeRepository.findAll()).thenReturn(List.of(testStore));
        when(productVariantRepository.findById(inStockVariant.getId())).thenReturn(Optional.of(inStockVariant));
        when(productVariantRepository.findById(indentVariant.getId())).thenReturn(Optional.of(indentVariant));

        // In-stock has 2 units; indent has 0 units
        when(stockUnitRepository.countByProductVariantIdAndAvailabilityStatus(inStockVariant.getId(), StockAvailability.AVAILABLE))
                .thenReturn(2L);
        when(stockUnitRepository.countByProductVariantIdAndAvailabilityStatus(indentVariant.getId(), StockAvailability.AVAILABLE))
                .thenReturn(0L);

        when(customerRepository.search(any())).thenReturn(List.of());
        when(customerRepository.save(any(Customer.class))).thenAnswer(inv -> {
            Customer c = inv.getArgument(0);
            ReflectionTestUtils.setField(c, "id", UUID.randomUUID());
            return c;
        });
        when(salesOrderRepository.save(any(SalesOrder.class))).thenAnswer(inv -> {
            SalesOrder so = inv.getArgument(0);
            ReflectionTestUtils.setField(so, "id", UUID.randomUUID());
            ReflectionTestUtils.setField(so, "createdAt", Instant.now());
            return so;
        });
        when(salesOrderItemRepository.save(any(SalesOrderItem.class))).thenAnswer(inv -> {
            SalesOrderItem item = inv.getArgument(0);
            ReflectionTestUtils.setField(item, "id", UUID.randomUUID());
            return item;
        });
        when(fulfillmentGroupRepository.save(any(FulfillmentGroup.class))).thenAnswer(inv -> {
            FulfillmentGroup fg = inv.getArgument(0);
            ReflectionTestUtils.setField(fg, "id", UUID.randomUUID());
            return fg;
        });
        when(fulfillmentGroupItemRepository.save(any(FulfillmentGroupItem.class))).thenAnswer(inv -> {
            FulfillmentGroupItem fgi = inv.getArgument(0);
            ReflectionTestUtils.setField(fgi, "id", UUID.randomUUID());
            return fgi;
        });

        CheckoutRequest request = new CheckoutRequest(
                "John Doe",
                "john@example.com",
                "08123456789",
                new CheckoutRequest.DeliveryAddressDto("John", "08123456789", "Jl. Melati No. 12", "Jakarta", "DKI", "12345"),
                "PARTIAL",   // Decision A: Customer accepts partial staggered delivery
                "DELIVERY",  // Decision B: Home delivery by driver
                null,
                "QRIS",
                "Mohon antar in-stock duluan",
                "ONLINE_WEB",
                List.of(
                        new CheckoutRequest.CheckoutItemDto(inStockVariant.getId(), 1),
                        new CheckoutRequest.CheckoutItemDto(indentVariant.getId(), 1)
                )
        );

        CheckoutResponse response = checkoutService.processCheckout(request);

        assertThat(response).isNotNull();
        assertThat(response.fulfillmentPreference()).isEqualTo("PARTIAL");
        assertThat(response.fulfillmentGroups()).hasSize(2);

        // Group 1: In-stock immediate delivery
        CheckoutResponse.FulfillmentGroupSummaryDto fg1 = response.fulfillmentGroups().get(0);
        assertThat(fg1.groupNumber()).isEqualTo(1);
        assertThat(fg1.status()).isEqualTo("READY_FOR_PACKING");
        assertThat(fg1.items().get(0).isProcurementRequired()).isFalse();

        // Group 2: Indent procurement backorder
        CheckoutResponse.FulfillmentGroupSummaryDto fg2 = response.fulfillmentGroups().get(1);
        assertThat(fg2.groupNumber()).isEqualTo(2);
        assertThat(fg2.status()).isEqualTo("AWAITING_PROCUREMENT");
        assertThat(fg2.items().get(0).isProcurementRequired()).isTrue();

        // Deposit-First rule: 30% deposit calculated because an item requires procurement
        assertThat(response.requiredDepositAmount()).isGreaterThan(BigDecimal.ZERO);
    }

    @Test
    void testDepositFirstPaymentSimulation() {
        SalesOrder order = new SalesOrder();
        ReflectionTestUtils.setField(order, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(order, "createdAt", Instant.now());
        order.setNumber("SO-WEB-TEST-01");
        order.setTotalAmount(BigDecimal.valueOf(2500000));
        order.setRequiredDepositAmount(BigDecimal.valueOf(750000));
        order.setDepositPaid(false);

        FulfillmentGroup fg = new FulfillmentGroup();
        ReflectionTestUtils.setField(fg, "id", UUID.randomUUID());
        fg.setSalesOrder(order);
        fg.setGroupNumber(1);
        fg.setStatus("AWAITING_PROCUREMENT");

        when(salesOrderRepository.findById(order.getId())).thenReturn(Optional.of(order));
        when(fulfillmentGroupRepository.findBySalesOrderIdOrderByGroupNumberAsc(order.getId())).thenReturn(List.of(fg));

        StorefrontOrderDto updated = checkoutService.simulatePayment(order.getId());

        assertThat(updated.depositPaid()).isTrue();
        assertThat(fg.getStatus()).isEqualTo("READY_FOR_PACKING");
        assertThat(fg.getNotes()).contains("Customer deposit verified. Procurement authorized");
    }

    @Test
    void testStorefrontCartOperations() {
        CustomerCart cart = new CustomerCart();
        ReflectionTestUtils.setField(cart, "id", UUID.randomUUID());
        cart.setSessionId("session-abc");

        when(cartRepository.findBySessionId("session-abc")).thenReturn(Optional.of(cart));
        when(productVariantRepository.findById(inStockVariant.getId())).thenReturn(Optional.of(inStockVariant));
        when(cartItemRepository.findByCartIdAndProductVariantId(cart.getId(), inStockVariant.getId()))
                .thenReturn(Optional.empty());

        CustomerCartItem savedItem = new CustomerCartItem();
        ReflectionTestUtils.setField(savedItem, "id", UUID.randomUUID());
        savedItem.setCart(cart);
        savedItem.setProductVariant(inStockVariant);
        savedItem.setQuantity(2);

        when(cartItemRepository.findByCartId(cart.getId())).thenReturn(List.of(savedItem));

        StorefrontCartDto result = cartService.addItem("session-abc", new AddToCartRequest(inStockVariant.getId(), 2));

        assertThat(result.totalItemCount()).isEqualTo(2);
        assertThat(result.items()).hasSize(1);
        assertThat(result.subtotalAmount()).isGreaterThan(BigDecimal.ZERO);
        assertThat(result.totalAmount()).isGreaterThan(result.subtotalAmount()); // Includes tax
    }
}
