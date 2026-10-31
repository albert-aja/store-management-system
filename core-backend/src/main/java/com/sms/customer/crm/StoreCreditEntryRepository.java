package com.sms.customer.crm;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreCreditEntryRepository extends JpaRepository<StoreCreditEntry, UUID> {
    List<StoreCreditEntry> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);
    Optional<StoreCreditEntry> findFirstByCustomerIdOrderByCreatedAtDesc(UUID customerId);
}

