package com.sms.repossession;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RepairTicketRepository extends JpaRepository<RepairTicket, UUID> {

    Optional<RepairTicket> findByTicketNumber(String ticketNumber);

    List<RepairTicket> findByStockUnitIdOrderByCreatedAtDesc(UUID stockUnitId);

    @Query("SELECT r FROM RepairTicket r WHERE (:storeId IS NULL OR r.store.id = :storeId) AND (:status IS NULL OR r.status = :status) ORDER BY r.createdAt DESC")
    List<RepairTicket> search(@Param("storeId") UUID storeId, @Param("status") RepairStatus status);
}
