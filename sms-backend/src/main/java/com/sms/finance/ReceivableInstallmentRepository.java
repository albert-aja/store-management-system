package com.sms.finance;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReceivableInstallmentRepository extends JpaRepository<ReceivableInstallment, UUID> {

    List<ReceivableInstallment> findByReceivableIdOrderByInstallmentNumberAsc(UUID receivableId);

    @Query("SELECT i FROM ReceivableInstallment i WHERE i.receivable.customer.id = :customerId AND i.status != 'PAID' AND i.status != 'FORGIVEN' ORDER BY i.dueDate ASC, i.installmentNumber ASC")
    List<ReceivableInstallment> findOutstandingByCustomerId(@Param("customerId") UUID customerId);

    @Query("SELECT i FROM ReceivableInstallment i WHERE i.receivable.id = :receivableId AND i.status != 'PAID' AND i.status != 'FORGIVEN' ORDER BY i.dueDate ASC, i.installmentNumber ASC")
    List<ReceivableInstallment> findOutstandingByReceivableId(@Param("receivableId") UUID receivableId);

    @Query("SELECT i FROM ReceivableInstallment i WHERE i.status != 'PAID' AND i.status != 'FORGIVEN' AND i.dueDate < :cutoffDate ORDER BY i.dueDate ASC")
    List<ReceivableInstallment> findOverdueInstallments(@Param("cutoffDate") LocalDate cutoffDate);
}
