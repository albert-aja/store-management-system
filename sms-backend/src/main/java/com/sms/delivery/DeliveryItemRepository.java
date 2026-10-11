package com.sms.delivery;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DeliveryItemRepository extends JpaRepository<DeliveryItem, UUID> {

    List<DeliveryItem> findByDeliveryOrderId(UUID deliveryOrderId);

    List<DeliveryItem> findBySoItemStockUnitId(UUID soItemStockUnitId);

    @Query("""
        select count(i) > 0 from DeliveryItem i
        where i.soItemStockUnit.id = :soItemStockUnitId
          and i.deliveryOrder.status not in ('FAILED', 'CANCELLED')
    """)
    boolean isStockUnitInActiveDelivery(@Param("soItemStockUnitId") UUID soItemStockUnitId);
}
