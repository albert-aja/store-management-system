package com.sms.pricing;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import com.sms.product.dto.ProductVariant;
import com.sms.product.repository.ProductVariantRepository;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PricingServiceTest {

    @Mock
    private StoreProductPriceRepository priceRepository;
    @Mock
    private StoreProductPaymentPlanRepository planRepository;
    @Mock
    private StoreRepository storeRepository;
    @Mock
    private ProductVariantRepository variantRepository;

    @InjectMocks
    private PricingService pricingService;

    @Test
    void upsertPrice_updatesExistingRowInPlaceInsteadOfCreatingHistory() {
        UUID storeId = UUID.randomUUID();
        UUID variantId = UUID.randomUUID();
        StoreProductPrice existing = new StoreProductPrice();
        existing.setCashPrice(BigDecimal.valueOf(1_000_000));
        when(priceRepository.findByStoreIdAndProductVariantId(storeId, variantId)).thenReturn(Optional.of(existing));

        StoreProductPrice result = pricingService.upsertPrice(storeId, variantId, BigDecimal.valueOf(1_200_000));

        assertThat(result).isSameAs(existing);
        assertThat(result.getCashPrice()).isEqualByComparingTo("1200000");
    }

    @Test
    void upsertPrice_createsNewRowWhenNoneExists() {
        UUID storeId = UUID.randomUUID();
        UUID variantId = UUID.randomUUID();
        when(priceRepository.findByStoreIdAndProductVariantId(storeId, variantId)).thenReturn(Optional.empty());
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(new Store()));
        when(variantRepository.findById(variantId)).thenReturn(Optional.of(new ProductVariant()));
        when(priceRepository.save(org.mockito.ArgumentMatchers.any())).thenAnswer(inv -> inv.getArgument(0));

        StoreProductPrice result = pricingService.upsertPrice(storeId, variantId, BigDecimal.valueOf(500_000));

        assertThat(result.getCashPrice()).isEqualByComparingTo("500000");
    }
}
