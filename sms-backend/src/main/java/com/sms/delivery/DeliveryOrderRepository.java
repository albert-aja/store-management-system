package com.sms.delivery;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DeliveryOrderRepository extends JpaRepository<DeliveryOrder, UUID> {

    List<DeliveryOrder> findByDeliveryTripIdOrderByStopSequenceAsc(UUID deliveryTripId);

    List<DeliveryOrder> findBySalesOrderIdOrderByCreatedAtDesc(UUID salesOrderId);

    @Query("""
        select o from DeliveryOrder o
        where (:salesOrderId is null or o.salesOrder.id = :salesOrderId)
          and (:tripId is null or o.deliveryTrip.id = :tripId)
          and (:status is null or o.status = :status)
        order by o.createdAt desc
    """)
    List<DeliveryOrder> searchOrders(
            @Param("salesOrderId") UUID salesOrderId,
            @Param("tripId") UUID tripId,
            @Param("status") DeliveryOrderStatus status
    );
}
