package com.sms.storefront.repository;

import com.sms.storefront.model.FulfillmentGroup;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FulfillmentGroupRepository extends JpaRepository<FulfillmentGroup, UUID> {
    List<FulfillmentGroup> findBySalesOrderIdOrderByGroupNumberAsc(UUID salesOrderId);

    Optional<FulfillmentGroup> findByPickupPassCode(String pickupPassCode);

    Optional<FulfillmentGroup> findBySalesOrderNumberAndGroupNumber(String orderNumber, int groupNumber);

    List<FulfillmentGroup> findByPickupStoreIdAndStatus(UUID pickupStoreId, String status);

    List<FulfillmentGroup> findByFulfillmentMethodAndStatus(String fulfillmentMethod, String status);
}
