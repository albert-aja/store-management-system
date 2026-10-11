package com.sms.inventory;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComponentStockRepository extends JpaRepository<ComponentStock, UUID> {

    List<ComponentStock> findByStoreId(UUID storeId);

    Optional<ComponentStock> findByStoreIdAndProductComponentId(UUID storeId, UUID productComponentId);
}
