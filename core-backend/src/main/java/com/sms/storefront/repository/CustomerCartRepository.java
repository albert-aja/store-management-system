package com.sms.storefront.repository;

import com.sms.storefront.model.CustomerCart;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerCartRepository extends JpaRepository<CustomerCart, UUID> {
    Optional<CustomerCart> findBySessionId(String sessionId);
    Optional<CustomerCart> findByCustomerId(UUID customerId);
}

