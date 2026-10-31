package com.sms.storefront.repository;

import com.sms.storefront.model.FulfillmentGroupItem;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FulfillmentGroupItemRepository extends JpaRepository<FulfillmentGroupItem, UUID> {
    List<FulfillmentGroupItem> findByFulfillmentGroupId(UUID fulfillmentGroupId);
}

