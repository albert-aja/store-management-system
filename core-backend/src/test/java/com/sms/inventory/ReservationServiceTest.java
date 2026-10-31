package com.sms.inventory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.sms.foundation.store.Store;
import com.sms.sales.SalesOrder;
import com.sms.sales.SalesOrderItem;
import com.sms.sales.SalesOrderItemRepository;
import com.sms.product.dto.ProductVariant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    @Mock
    private StockUnitRepository stockUnitRepository;
    @Mock
    private SalesOrderItemRepository salesOrderItemRepository;

    @InjectMocks
    private ReservationService reservationService;

    @Test
    void reserveForSalesOrder_reservesOnlyWhatIsAvailableWithoutFailing() {
        UUID soId = UUID.randomUUID();
        Store store = new Store();
        SalesOrder so = new SalesOrder();
        so.setStore(store);
        ReflectionTestUtils.setField(so, "id", soId);

        ProductVariant variant = new ProductVariant();
        SalesOrderItem item = new SalesOrderItem();
        item.setProductVariant(variant);
        item.setQuantity(3);
        ReflectionTestUtils.setField(item, "id", UUID.randomUUID());
        when(salesOrderItemRepository.findBySalesOrderId(soId)).thenReturn(List.of(item));
        when(stockUnitRepository.findByReservedForSoItemIdIn(List.of(item.getId()))).thenReturn(List.of());

        StockUnit unit1 = new StockUnit();
        unit1.setAvailabilityStatus(StockAvailability.AVAILABLE);
        StockUnit unit2 = new StockUnit();
        unit2.setAvailabilityStatus(StockAvailability.AVAILABLE);
        when(stockUnitRepository.findByCurrentStoreIdAndProductVariantIdAndAvailabilityStatus(
                null, null, StockAvailability.AVAILABLE)).thenReturn(List.of(unit1, unit2));

        reservationService.reserveForSalesOrder(so);

        assertThat(unit1.getAvailabilityStatus()).isEqualTo(StockAvailability.RESERVED);
        assertThat(unit2.getAvailabilityStatus()).isEqualTo(StockAvailability.RESERVED);
        assertThat(unit1.getReservedForSoItem()).isEqualTo(item);
    }

    @Test
    void releaseForSalesOrder_freesReservedUnitsBackToAvailable() {
        UUID soId = UUID.randomUUID();
        SalesOrderItem item = new SalesOrderItem();
        ReflectionTestUtils.setField(item, "id", UUID.randomUUID());
        when(salesOrderItemRepository.findBySalesOrderId(soId)).thenReturn(List.of(item));

        StockUnit unit = new StockUnit();
        unit.setAvailabilityStatus(StockAvailability.RESERVED);
        unit.setReservedForSoItem(item);
        when(stockUnitRepository.findByReservedForSoItemIdIn(List.of(item.getId()))).thenReturn(List.of(unit));

        reservationService.releaseForSalesOrder(soId);

        assertThat(unit.getAvailabilityStatus()).isEqualTo(StockAvailability.AVAILABLE);
        assertThat(unit.getReservedForSoItem()).isNull();
    }
}
