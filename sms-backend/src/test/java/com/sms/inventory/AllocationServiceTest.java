package com.sms.inventory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.sms.common.web.BusinessRuleException;
import com.sms.sales.SalesOrderItem;
import com.sms.sales.SalesOrderItemRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AllocationServiceTest {

    @Mock
    private SalesOrderItemStockUnitRepository allocationRepository;
    @Mock
    private SalesOrderItemRepository itemRepository;
    @Mock
    private StockUnitRepository stockUnitRepository;

    @InjectMocks
    private AllocationService allocationService;

    @Test
    void allocate_rejectsUnitReservedForAnotherItem() {
        UUID itemId = UUID.randomUUID();
        UUID unitId = UUID.randomUUID();
        SalesOrderItem thisItem = new SalesOrderItem();
        ReflectionTestUtils.setField(thisItem, "id", itemId);
        SalesOrderItem otherItem = new SalesOrderItem();
        ReflectionTestUtils.setField(otherItem, "id", UUID.randomUUID());

        StockUnit unit = new StockUnit();
        unit.setAvailabilityStatus(StockAvailability.RESERVED);
        unit.setReservedForSoItem(otherItem);

        when(itemRepository.findById(itemId)).thenReturn(Optional.of(thisItem));
        when(stockUnitRepository.findById(unitId)).thenReturn(Optional.of(unit));

        assertThatThrownBy(() -> allocationService.allocate(itemId, unitId)).isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void allocate_succeedsWhenUnitReservedForThisItem() {
        UUID itemId = UUID.randomUUID();
        UUID unitId = UUID.randomUUID();
        SalesOrderItem item = new SalesOrderItem();
        ReflectionTestUtils.setField(item, "id", itemId);

        StockUnit unit = new StockUnit();
        unit.setAvailabilityStatus(StockAvailability.RESERVED);
        unit.setReservedForSoItem(item);

        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(stockUnitRepository.findById(unitId)).thenReturn(Optional.of(unit));
        when(allocationRepository.findBySalesOrderItemIdAndReleasedAtIsNull(itemId)).thenReturn(List.of());
        when(allocationRepository.save(org.mockito.ArgumentMatchers.any())).thenAnswer(inv -> inv.getArgument(0));

        var allocation = allocationService.allocate(itemId, unitId);

        assertThat(allocation.getStockUnit()).isEqualTo(unit);
    }
}
