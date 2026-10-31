package com.sms.customer.crm;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerFollowUpRepository extends JpaRepository<CustomerFollowUp, UUID> {
    List<CustomerFollowUp> findByCustomerIdOrderByScheduledAtAsc(UUID customerId);
    List<CustomerFollowUp> findByStatusOrderByScheduledAtAsc(FollowUpStatus status);
}

