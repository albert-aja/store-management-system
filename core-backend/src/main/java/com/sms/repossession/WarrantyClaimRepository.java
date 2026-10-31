package com.sms.repossession;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WarrantyClaimRepository extends JpaRepository<WarrantyClaim, UUID> {

    Optional<WarrantyClaim> findByClaimNumber(String claimNumber);

    List<WarrantyClaim> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);

    @Query("SELECT c FROM WarrantyClaim c WHERE (:storeId IS NULL OR c.store.id = :storeId) AND (:status IS NULL OR c.status = :status) ORDER BY c.createdAt DESC")
    List<WarrantyClaim> search(@Param("storeId") UUID storeId, @Param("status") WarrantyClaimStatus status);
}
