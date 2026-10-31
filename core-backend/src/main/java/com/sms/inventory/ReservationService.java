package com.sms.inventory;

import com.sms.sales.SalesOrder;
import com.sms.sales.SalesOrderItem;
import com.sms.sales.SalesOrderItemRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Wires README 7.1's reservation rule into the Sales Order lifecycle. Best-effort: if fewer Stock Units are
 * available than the item quantity, whatever is available is reserved and the rest is left unreserved rather
 * than blocking the business transition (no strict "must have full stock" rule is stated in the source spec).
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ReservationService {

    private final StockUnitRepository stockUnitRepository;
    private final SalesOrderItemRepository salesOrderItemRepository;

    public void reserveForSalesOrder(SalesOrder salesOrder) {
        for (SalesOrderItem item : salesOrderItemRepository.findBySalesOrderId(salesOrder.getId())) {
            long alreadyReserved = stockUnitRepository.findByReservedForSoItemIdIn(List.of(item.getId())).size();
            int remaining = item.getQuantity() - (int) alreadyReserved;
            if (remaining <= 0) {
                continue;
            }
            List<StockUnit> available = stockUnitRepository.findByCurrentStoreIdAndProductVariantIdAndAvailabilityStatus(
                    salesOrder.getStore().getId(), item.getProductVariant().getId(), StockAvailability.AVAILABLE);
            available.stream().limit(remaining).forEach(unit -> {
                unit.setAvailabilityStatus(StockAvailability.RESERVED);
                unit.setReservedForSoItem(item);
            });
        }
    }

    /** Rejection/cancellation/invalidity releases reservations (README 7.1). */
    public void releaseForSalesOrder(UUID salesOrderId) {
        List<UUID> itemIds = salesOrderItemRepository.findBySalesOrderId(salesOrderId).stream()
                .map(SalesOrderItem::getId).toList();
        if (itemIds.isEmpty()) {
            return;
        }
        stockUnitRepository.findByReservedForSoItemIdIn(itemIds).forEach(unit -> {
            unit.setAvailabilityStatus(StockAvailability.AVAILABLE);
            unit.setReservedForSoItem(null);
        });
    }
}
