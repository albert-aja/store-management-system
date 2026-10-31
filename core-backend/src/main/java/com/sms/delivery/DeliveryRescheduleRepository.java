package com.sms.delivery;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeliveryRescheduleRepository extends JpaRepository<DeliveryRescheduleRequest, UUID> {
    List<DeliveryRescheduleRequest> findByDeliveryOrderIdOrderByCreatedAtDesc(UUID deliveryOrderId);
    boolean existsByDeliveryOrderIdAndStatus(UUID deliveryOrderId, DeliveryRescheduleRequest.Status status);
    List<DeliveryRescheduleRequest> findByStatusOrderByCreatedAtAsc(DeliveryRescheduleRequest.Status status);
}
