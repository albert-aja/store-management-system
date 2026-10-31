package com.sms.storefront.repository;

import com.sms.storefront.model.StorefrontAddress;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StorefrontAddressRepository extends JpaRepository<StorefrontAddress, UUID> {
    List<StorefrontAddress> findByCustomerIdOrderByIsDefaultDesc(UUID customerId);
}

