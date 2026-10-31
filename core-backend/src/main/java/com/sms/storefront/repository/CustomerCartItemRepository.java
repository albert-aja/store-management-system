package com.sms.storefront.repository;

import com.sms.storefront.model.CustomerCartItem;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerCartItemRepository extends JpaRepository<CustomerCartItem, UUID> {
    List<CustomerCartItem> findByCartId(UUID cartId);
    Optional<CustomerCartItem> findByCartIdAndProductVariantId(UUID cartId, UUID productVariantId);
    void deleteByCartId(UUID cartId);
}

