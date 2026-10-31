package com.sms.repossession;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StockDisposalRepository extends JpaRepository<StockDisposal, UUID> {

    Optional<StockDisposal> findByDisposalNumber(String disposalNumber);

    List<StockDisposal> findByStockUnitId(UUID stockUnitId);

    @Query("SELECT d FROM StockDisposal d WHERE (:storeId IS NULL OR d.store.id = :storeId) ORDER BY d.disposedAt DESC")
    List<StockDisposal> search(@Param("storeId") UUID storeId);
}
