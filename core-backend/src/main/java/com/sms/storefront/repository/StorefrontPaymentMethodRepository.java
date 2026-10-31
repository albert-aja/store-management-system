package com.sms.storefront.repository;

import com.sms.storefront.model.StorefrontPaymentMethod;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StorefrontPaymentMethodRepository extends JpaRepository<StorefrontPaymentMethod, UUID> {
    List<StorefrontPaymentMethod> findByEnabledTrueOrderByDisplayOrderAsc();
    Optional<StorefrontPaymentMethod> findByCode(String code);
}

