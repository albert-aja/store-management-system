package com.sms.sales;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SalesOrderRepository extends JpaRepository<SalesOrder, UUID> {

    @Query("""
            select so from SalesOrder so
            where (:storeId is null or so.store.id = :storeId)
              and (:customerId is null or so.customer.id = :customerId)
              and (:status is null or so.status = :status)
            order by so.createdAt desc
            """)
    List<SalesOrder> search(@Param("storeId") UUID storeId, @Param("customerId") UUID customerId,
                             @Param("status") SalesOrderStatus status);
}
