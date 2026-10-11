package com.sms.inventory;

import com.sms.common.web.BusinessRuleException;
import com.sms.common.web.NotFoundException;
import com.sms.sales.SalesOrderItem;
import com.sms.sales.SalesOrderItemRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Permanent association between an SO item and an exact Stock Unit (README 7.2), distinct from reservation. */
@Service
@RequiredArgsConstructor
@Transactional
public class AllocationService {

    private final SalesOrderItemStockUnitRepository allocationRepository;
    private final SalesOrderItemRepository itemRepository;
    private final StockUnitRepository stockUnitRepository;

    @Transactional(readOnly = true)
    public List<SalesOrderItemStockUnit> listForItem(UUID salesOrderItemId) {
        return allocationRepository.findBySalesOrderItemId(salesOrderItemId);
    }

    public SalesOrderItemStockUnit allocate(UUID salesOrderItemId, UUID stockUnitId) {
        SalesOrderItem item = itemRepository.findById(salesOrderItemId)
                .orElseThrow(() -> new NotFoundException("Sales Order item not found: " + salesOrderItemId));
        StockUnit unit = stockUnitRepository.findById(stockUnitId)
                .orElseThrow(() -> new NotFoundException("Stock Unit not found: " + stockUnitId));

        boolean reservedForThisItem = unit.getReservedForSoItem() != null
                && unit.getReservedForSoItem().getId().equals(salesOrderItemId);
        if (unit.getAvailabilityStatus() == StockAvailability.UNAVAILABLE
                || (unit.getAvailabilityStatus() == StockAvailability.RESERVED && !reservedForThisItem)) {
            throw new BusinessRuleException("Stock Unit is not available for allocation to this item");
        }
        boolean alreadyAllocatedToThisItem = allocationRepository.findBySalesOrderItemIdAndReleasedAtIsNull(salesOrderItemId)
                .stream().anyMatch(a -> a.getStockUnit().getId().equals(stockUnitId));
        if (alreadyAllocatedToThisItem) {
            throw new BusinessRuleException("Stock Unit is already allocated to this item");
        }

        SalesOrderItemStockUnit allocation = new SalesOrderItemStockUnit();
        allocation.setSalesOrderItem(item);
        allocation.setStockUnit(unit);
        return allocationRepository.save(allocation);
    }

    /** Damaged/unusable allocation can be replaced by another unit without rewriting history (README 7.2). */
    public void releaseAllocation(UUID allocationId) {
        SalesOrderItemStockUnit allocation = allocationRepository.findById(allocationId)
                .orElseThrow(() -> new NotFoundException("Allocation not found: " + allocationId));
        allocation.setReleasedAt(Instant.now());
        StockUnit unit = allocation.getStockUnit();
        unit.setAvailabilityStatus(StockAvailability.AVAILABLE);
        unit.setReservedForSoItem(null);
    }
}
