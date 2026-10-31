package com.sms.finance;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CollectionAttemptRepository extends JpaRepository<CollectionAttempt, UUID> {

    List<CollectionAttempt> findByCustomerIdOrderByVisitDateDesc(UUID customerId);

    List<CollectionAttempt> findByReceivableIdOrderByVisitDateDesc(UUID receivableId);

    @Query("SELECT a FROM CollectionAttempt a WHERE (:storeId IS NULL OR a.store.id = :storeId) AND (:customerId IS NULL OR a.customer.id = :customerId) ORDER BY a.visitDate DESC")
    List<CollectionAttempt> search(@Param("storeId") UUID storeId, @Param("customerId") UUID customerId);
}
