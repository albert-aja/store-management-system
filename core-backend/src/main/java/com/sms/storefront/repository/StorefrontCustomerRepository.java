package com.sms.storefront.repository;

import com.sms.storefront.model.StorefrontCustomer;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StorefrontCustomerRepository extends JpaRepository<StorefrontCustomer, UUID> {
    Optional<StorefrontCustomer> findByEmail(String email);
    Optional<StorefrontCustomer> findByEmailIgnoreCase(String email);
    Optional<StorefrontCustomer> findByAuthUserId(UUID authUserId);
    Optional<StorefrontCustomer> findByPhone(String phone);
    boolean existsByEmail(String email);
}
