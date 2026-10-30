package com.sms.customer.crm;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerInteractionRepository extends JpaRepository<CustomerInteraction, UUID> {
    List<CustomerInteraction> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);
    long countByCustomerId(UUID customerId);
}

