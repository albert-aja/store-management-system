package com.sms.pricing;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreProductPriceRepository extends JpaRepository<StoreProductPrice, UUID> {

    List<StoreProductPrice> findByStoreId(UUID storeId);

    Optional<StoreProductPrice> findByStoreIdAndProductVariantId(UUID storeId, UUID productVariantId);

    List<StoreProductPrice> findByProductVariantId(UUID productVariantId);

    Optional<StoreProductPrice> findFirstByProductVariantIdAndActiveTrue(UUID productVariantId);
}
