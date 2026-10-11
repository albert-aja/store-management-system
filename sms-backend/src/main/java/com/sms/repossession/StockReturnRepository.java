package com.sms.repossession;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StockReturnRepository extends JpaRepository<StockReturn, UUID> {

    Optional<StockReturn> findByReturnNumber(String returnNumber);

    List<StockReturn> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);

    List<StockReturn> findByStockUnitIdOrderByCreatedAtDesc(UUID stockUnitId);

    @Query("SELECT r FROM StockReturn r WHERE (:storeId IS NULL OR r.store.id = :storeId) AND (:status IS NULL OR r.status = :status) AND (:returnType IS NULL OR r.returnType = :returnType) ORDER BY r.createdAt DESC")
    List<StockReturn> search(@Param("storeId") UUID storeId, @Param("status") StockReturnStatus status, @Param("returnType") StockReturnType returnType);
}
