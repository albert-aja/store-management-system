package com.sms.storefront.repository;

import com.sms.storefront.model.CustomerDeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerDeviceTokenRepository extends JpaRepository<CustomerDeviceToken, String> {
    Optional<CustomerDeviceToken> findByDeviceToken(String deviceToken);
    List<CustomerDeviceToken> findByCustomerIdAndActiveTrue(UUID customerId);
}
