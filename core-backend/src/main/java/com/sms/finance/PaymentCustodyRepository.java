package com.sms.finance;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentCustodyRepository extends JpaRepository<PaymentCustody, UUID> {

    Optional<PaymentCustody> findByCustomerPaymentId(UUID customerPaymentId);

    List<PaymentCustody> findByHolderEmployeeId(UUID holderEmployeeId);

    @Query("SELECT c FROM PaymentCustody c WHERE (:holderId IS NULL OR c.holderEmployee.id = :holderId) AND (:status IS NULL OR c.status = :status) ORDER BY c.collectedAt DESC")
    List<PaymentCustody> search(@Param("holderId") UUID holderId, @Param("status") CustodyStatus status);
}
