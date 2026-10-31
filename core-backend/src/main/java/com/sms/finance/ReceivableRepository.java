package com.sms.finance;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReceivableRepository extends JpaRepository<Receivable, UUID> {

    List<Receivable> findByStoreId(UUID storeId);

    List<Receivable> findByCustomerId(UUID customerId);

    List<Receivable> findBySalesOrderId(UUID salesOrderId);

    Optional<Receivable> findByReceivableNumber(String receivableNumber);

    @Query("SELECT r FROM Receivable r WHERE (:storeId IS NULL OR r.store.id = :storeId) AND (:customerId IS NULL OR r.customer.id = :customerId) AND (:status IS NULL OR r.status = :status) ORDER BY r.createdAt DESC")
    List<Receivable> search(@Param("storeId") UUID storeId, @Param("customerId") UUID customerId, @Param("status") ReceivableStatus status);
}
