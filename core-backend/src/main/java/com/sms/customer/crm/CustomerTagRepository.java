package com.sms.customer.crm;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerTagRepository extends JpaRepository<CustomerTag, UUID> {
    List<CustomerTag> findByCustomerIdOrderByTagNameAsc(UUID customerId);
    Optional<CustomerTag> findByCustomerIdAndTagNameIgnoreCase(UUID customerId, String tagName);
    void deleteByCustomerIdAndTagNameIgnoreCase(UUID customerId, String tagName);
}

