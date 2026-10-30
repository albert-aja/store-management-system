package com.sms.customer.crm;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerPromiseToPayRepository extends JpaRepository<CustomerPromiseToPay, UUID> {
    List<CustomerPromiseToPay> findByCustomerIdOrderByPromisedDateDesc(UUID customerId);
    List<CustomerPromiseToPay> findByStatusOrderByPromisedDateAsc(PtpStatus status);
    long countByCustomerIdAndStatus(UUID customerId, PtpStatus status);
}

