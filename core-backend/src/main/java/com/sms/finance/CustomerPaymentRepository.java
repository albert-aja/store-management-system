package com.sms.finance;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CustomerPaymentRepository extends JpaRepository<CustomerPayment, UUID> {

    List<CustomerPayment> findByCustomerIdOrderByPaidAtDesc(UUID customerId);

    List<CustomerPayment> findBySalesOrderIdOrderByPaidAtDesc(UUID salesOrderId);

    Optional<CustomerPayment> findByPaymentNumber(String paymentNumber);

    @Query("SELECT p FROM CustomerPayment p WHERE (:storeId IS NULL OR p.store.id = :storeId) AND (:customerId IS NULL OR p.customer.id = :customerId) ORDER BY p.paidAt DESC")
    List<CustomerPayment> search(@Param("storeId") UUID storeId, @Param("customerId") UUID customerId);
}
