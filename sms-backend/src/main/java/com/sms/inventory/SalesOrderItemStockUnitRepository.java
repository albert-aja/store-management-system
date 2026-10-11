package com.sms.inventory;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SalesOrderItemStockUnitRepository extends JpaRepository<SalesOrderItemStockUnit, UUID> {

    List<SalesOrderItemStockUnit> findBySalesOrderItemIdAndReleasedAtIsNull(UUID salesOrderItemId);

    List<SalesOrderItemStockUnit> findBySalesOrderItemId(UUID salesOrderItemId);
}
