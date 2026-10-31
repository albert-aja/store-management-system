package com.sms.procurement;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, UUID> {

    @Query("""
            select po from PurchaseOrder po
            where (:storeId is null or po.store.id = :storeId)
              and (:supplierId is null or po.supplier.id = :supplierId)
              and (:status is null or po.status = :status)
            order by po.createdAt desc
            """)
    List<PurchaseOrder> search(@Param("storeId") UUID storeId, @Param("supplierId") UUID supplierId,
                               @Param("status") PurchaseOrderStatus status);
}
