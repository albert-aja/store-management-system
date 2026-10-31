package com.sms.pricing;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sms.common.web.BusinessRuleException;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import com.sms.pricing.dto.DiscountCalculationResult;
import com.sms.pricing.dto.PriceDiscountRequest;
import com.sms.pricing.dto.PriceDiscountResponse;
import com.sms.product.dto.Product;
import com.sms.product.dto.ProductVariant;
import com.sms.product.repository.ProductRepository;
import com.sms.product.repository.ProductVariantRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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

@ExtendWith(MockitoExtension.class)
@DisplayName("PriceDiscountService Business Logic Test Suite")
class PriceDiscountServiceTest {

    @Mock private PriceDiscountRepository discountRepository;
    @Mock private StoreRepository storeRepository;
    @Mock private ProductRepository productRepository;
    @Mock private ProductVariantRepository variantRepository;

    @InjectMocks
    private PriceDiscountService discountService;

    private UUID storeId;
    private UUID productId;
    private UUID variantId;
    private Store store;
    private Product product;
    private ProductVariant variant;

    @BeforeEach
    void setUp() {
        storeId = UUID.randomUUID();
        productId = UUID.randomUUID();
        variantId = UUID.randomUUID();

        store = new Store();
        store.setName("Showroom Jakarta");
        ReflectionTestUtils.setField(store, "id", storeId);

        product = new Product();
        product.setName("Sofa Minimalis 3 Seater");
        ReflectionTestUtils.setField(product, "id", productId);

        variant = new ProductVariant();
        variant.setVariantName("Grey Fabric");
        variant.setProduct(product);
        ReflectionTestUtils.setField(variant, "id", variantId);
    }

    @Test
    @DisplayName("Create percentage discount saves entity with valid parameters")
    void testCreateDiscount_Percentage() {
        PriceDiscountRequest req = new PriceDiscountRequest(
                storeId,
                productId,
                variantId,
                "Promo Weekend 15%",
                DiscountType.PERCENTAGE,
                BigDecimal.valueOf(15),
                BigDecimal.valueOf(500000),
                BigDecimal.valueOf(300000),
                1,
                Instant.now(),
                Instant.now().plus(7, ChronoUnit.DAYS),
                true,
                10,
                "Furniture flash sale"
        );

        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(variantRepository.findById(variantId)).thenReturn(Optional.of(variant));
        when(discountRepository.save(any(PriceDiscount.class))).thenAnswer(inv -> {
            PriceDiscount d = inv.getArgument(0);
            ReflectionTestUtils.setField(d, "id", UUID.randomUUID());
            return d;
        });

        PriceDiscountResponse res = discountService.createDiscount(req);

        assertThat(res).isNotNull();
        assertThat(res.discountName()).isEqualTo("Promo Weekend 15%");
        assertThat(res.discountType()).isEqualTo(DiscountType.PERCENTAGE);
        assertThat(res.discountValue()).isEqualByComparingTo("15");
        assertThat(res.storeName()).isEqualTo("Showroom Jakarta");
        assertThat(res.productName()).isEqualTo("Sofa Minimalis 3 Seater");
        assertThat(res.variantName()).isEqualTo("Grey Fabric");
    }

    @Test
    @DisplayName("Validation fails if discount value is zero or percentage exceeds 100")
    void testCreateDiscount_InvalidValues() {
        PriceDiscountRequest zeroReq = new PriceDiscountRequest(
                null, null, null, "Zero discount", DiscountType.FIXED_AMOUNT,
                BigDecimal.ZERO, null, null, 1, Instant.now(), Instant.now().plus(1, ChronoUnit.DAYS), true, 0, null
        );

        assertThatThrownBy(() -> discountService.createDiscount(zeroReq))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("greater than zero");

        PriceDiscountRequest over100Req = new PriceDiscountRequest(
                null, null, null, "Over 100", DiscountType.PERCENTAGE,
                BigDecimal.valueOf(105), null, null, 1, Instant.now(), Instant.now().plus(1, ChronoUnit.DAYS), true, 0, null
        );

        assertThatThrownBy(() -> discountService.createDiscount(over100Req))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("cannot exceed 100%");
    }

    @Test
    @DisplayName("calculateDiscount correctly calculates percentage discount")
    void testCalculateDiscount_Percentage() {
        PriceDiscount d = new PriceDiscount();
        d.setDiscountName("Super Promo 10%");
        d.setDiscountType(DiscountType.PERCENTAGE);
        d.setDiscountValue(BigDecimal.valueOf(10));
        ReflectionTestUtils.setField(d, "id", UUID.randomUUID());

        when(discountRepository.findActiveDiscountsForVariant(eq(storeId), eq(variantId), eq(productId), any()))
                .thenReturn(List.of(d));

        BigDecimal basePrice = BigDecimal.valueOf(2_000_000);
        DiscountCalculationResult res = discountService.calculateDiscount(storeId, variantId, productId, basePrice, 1);

        assertThat(res.isDiscounted()).isTrue();
        assertThat(res.discountAmount()).isEqualByComparingTo("200000");
        assertThat(res.discountedPrice()).isEqualByComparingTo("1800000");
        assertThat(res.discountPercentage()).isEqualTo(10);
        assertThat(res.appliedDiscountName()).isEqualTo("Super Promo 10%");
    }

    @Test
    @DisplayName("calculateDiscount clamps percentage discount to maximum cap")
    void testCalculateDiscount_WithMaxCap() {
        PriceDiscount d = new PriceDiscount();
        d.setDiscountName("20% Capped");
        d.setDiscountType(DiscountType.PERCENTAGE);
        d.setDiscountValue(BigDecimal.valueOf(20));
        d.setMaxDiscountAmount(BigDecimal.valueOf(150_000)); // Cap is 150k even though 20% of 1M is 200k
        ReflectionTestUtils.setField(d, "id", UUID.randomUUID());

        when(discountRepository.findActiveDiscountsForVariant(eq(storeId), eq(variantId), eq(productId), any()))
                .thenReturn(List.of(d));

        BigDecimal basePrice = BigDecimal.valueOf(1_000_000);
        DiscountCalculationResult res = discountService.calculateDiscount(storeId, variantId, productId, basePrice, 1);

        assertThat(res.isDiscounted()).isTrue();
        assertThat(res.discountAmount()).isEqualByComparingTo("150000");
        assertThat(res.discountedPrice()).isEqualByComparingTo("850000");
        assertThat(res.discountPercentage()).isEqualTo(15);
    }

    @Test
    @DisplayName("calculateDiscount correctly calculates fixed amount discount")
    void testCalculateDiscount_FixedAmount() {
        PriceDiscount d = new PriceDiscount();
        d.setDiscountName("Potongan Langsung 350rb");
        d.setDiscountType(DiscountType.FIXED_AMOUNT);
        d.setDiscountValue(BigDecimal.valueOf(350_000));
        ReflectionTestUtils.setField(d, "id", UUID.randomUUID());

        when(discountRepository.findActiveDiscountsForVariant(eq(storeId), eq(variantId), eq(productId), any()))
                .thenReturn(List.of(d));

        BigDecimal basePrice = BigDecimal.valueOf(1_500_000);
        DiscountCalculationResult res = discountService.calculateDiscount(storeId, variantId, productId, basePrice, 1);

        assertThat(res.isDiscounted()).isTrue();
        assertThat(res.discountAmount()).isEqualByComparingTo("350000");
        assertThat(res.discountedPrice()).isEqualByComparingTo("1150000");
    }

    @Test
    @DisplayName("calculateDiscount skips discount if minimum order amount is not met")
    void testCalculateDiscount_MinOrderAmountNotMet() {
        PriceDiscount d = new PriceDiscount();
        d.setDiscountName("Promo Belanja Min 2 Juta");
        d.setDiscountType(DiscountType.PERCENTAGE);
        d.setDiscountValue(BigDecimal.valueOf(15));
        d.setMinOrderAmount(BigDecimal.valueOf(2_000_000));
        ReflectionTestUtils.setField(d, "id", UUID.randomUUID());

        when(discountRepository.findActiveDiscountsForVariant(eq(storeId), eq(variantId), eq(productId), any()))
                .thenReturn(List.of(d));

        BigDecimal basePrice = BigDecimal.valueOf(1_000_000); // 1 item * 1M = 1M < 2M
        DiscountCalculationResult res = discountService.calculateDiscount(storeId, variantId, productId, basePrice, 1);

        assertThat(res.isDiscounted()).isFalse();
        assertThat(res.discountAmount()).isEqualByComparingTo("0");
        assertThat(res.discountedPrice()).isEqualByComparingTo("1000000");
    }

    @Test
    @DisplayName("calculateDiscount picks the discount with higher savings when multiple qualify")
    void testCalculateDiscount_SelectsBestSavings() {
        PriceDiscount d1 = new PriceDiscount();
        d1.setDiscountName("10% Off");
        d1.setDiscountType(DiscountType.PERCENTAGE);
        d1.setDiscountValue(BigDecimal.valueOf(10)); // 10% of 2M = 200k
        ReflectionTestUtils.setField(d1, "id", UUID.randomUUID());

        PriceDiscount d2 = new PriceDiscount();
        d2.setDiscountName("Potongan 300rb");
        d2.setDiscountType(DiscountType.FIXED_AMOUNT);
        d2.setDiscountValue(BigDecimal.valueOf(300_000)); // 300k savings
        ReflectionTestUtils.setField(d2, "id", UUID.randomUUID());

        when(discountRepository.findActiveDiscountsForVariant(eq(storeId), eq(variantId), eq(productId), any()))
                .thenReturn(List.of(d1, d2));

        BigDecimal basePrice = BigDecimal.valueOf(2_000_000);
        DiscountCalculationResult res = discountService.calculateDiscount(storeId, variantId, productId, basePrice, 1);

        assertThat(res.isDiscounted()).isTrue();
        assertThat(res.appliedDiscountName()).isEqualTo("Potongan 300rb");
        assertThat(res.discountAmount()).isEqualByComparingTo("300000");
        assertThat(res.discountedPrice()).isEqualByComparingTo("1700000");
    }

    @Test
    @DisplayName("Order-total fixed tier applies once when quantity threshold is reached")
    void testCalculateCartDiscount_OrderTotalQuantityTier() {
        PriceDiscount discount = new PriceDiscount();
        discount.setDiscountName("Beli 2 AC potong Rp300.000");
        discount.setDiscountType(DiscountType.FIXED_AMOUNT);
        discount.setDiscountScope(DiscountScope.ORDER_TOTAL);
        discount.setDiscountValue(BigDecimal.valueOf(300_000));
        discount.setMinQuantity(2);

        when(discountRepository.findActiveCartDiscounts(eq(storeId), any())).thenReturn(List.of(discount));

        var result = discountService.calculateCartDiscount(storeId, List.of(
                new com.sms.pricing.dto.CartDiscountLine(variantId, productId, BigDecimal.valueOf(1_500_000), 2)
        ));

        assertThat(result.discountAmount()).isEqualByComparingTo("300000");
        assertThat(result.discountName()).isEqualTo("Beli 2 AC potong Rp300.000");
    }

    @Test
    @DisplayName("Bundle discount requires all configured variants and discounts qualifying bundle subtotal")
    void testCalculateCartDiscount_MultiVariantBundle() {
        Product chairProduct = new Product();
        chairProduct.setName("Kursi Makan");
        UUID chairProductId = UUID.randomUUID();
        ReflectionTestUtils.setField(chairProduct, "id", chairProductId);
        ProductVariant chair = new ProductVariant();
        chair.setProduct(chairProduct);
        ReflectionTestUtils.setField(chair, "id", UUID.randomUUID());

        PriceDiscount discount = new PriceDiscount();
        discount.setDiscountName("Meja + 4 Kursi");
        discount.setDiscountType(DiscountType.PERCENTAGE);
        discount.setDiscountScope(DiscountScope.BUNDLE);
        discount.setDiscountValue(BigDecimal.TEN);

        PriceDiscountRequirement tableRequirement = new PriceDiscountRequirement();
        tableRequirement.setPriceDiscount(discount);
        tableRequirement.setProductVariant(variant);
        tableRequirement.setRequiredQuantity(1);
        PriceDiscountRequirement chairRequirement = new PriceDiscountRequirement();
        chairRequirement.setPriceDiscount(discount);
        chairRequirement.setProductVariant(chair);
        chairRequirement.setRequiredQuantity(4);
        discount.setRequirements(List.of(tableRequirement, chairRequirement));

        when(discountRepository.findActiveCartDiscounts(eq(storeId), any())).thenReturn(List.of(discount));

        var result = discountService.calculateCartDiscount(storeId, List.of(
                new com.sms.pricing.dto.CartDiscountLine(variantId, productId, BigDecimal.valueOf(2_000_000), 1),
                new com.sms.pricing.dto.CartDiscountLine(chair.getId(), chairProductId, BigDecimal.valueOf(500_000), 4)
        ));

        assertThat(result.discountAmount()).isEqualByComparingTo("400000");
        assertThat(result.discountName()).isEqualTo("Meja + 4 Kursi");
    }

    @Test
    @DisplayName("toggleActive flips active flag")
    void testToggleActive() {
        PriceDiscount d = new PriceDiscount();
        d.setActive(true);
        UUID id = UUID.randomUUID();
        when(discountRepository.findById(id)).thenReturn(Optional.of(d));

        PriceDiscountResponse res = discountService.toggleActive(id);

        assertThat(res.active()).isFalse();
        assertThat(d.isActive()).isFalse();
    }
}

