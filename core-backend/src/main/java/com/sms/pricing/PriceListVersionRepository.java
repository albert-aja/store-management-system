package com.sms.pricing;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PriceListVersionRepository extends JpaRepository<PriceListVersion, UUID> {

    List<PriceListVersion> findByStoreIdOrderByCreatedAtDesc(UUID storeId);

    Optional<PriceListVersion> findFirstByStoreIdAndGroupByOrderByCreatedAtDesc(UUID storeId, String groupBy);

    Optional<PriceListVersion> findFirstByStoreIdOrderByCreatedAtDesc(UUID storeId);

    long countByStoreId(UUID storeId);
}

