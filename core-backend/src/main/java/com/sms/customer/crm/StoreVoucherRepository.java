package com.sms.customer.crm;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreVoucherRepository extends JpaRepository<StoreVoucher, UUID> {
    Optional<StoreVoucher> findByCodeIgnoreCase(String code);
    List<StoreVoucher> findByAssignedCustomerIdOrderByValidUntilAsc(UUID customerId);
    List<StoreVoucher> findByActiveTrueOrderByValidUntilAsc();
}

