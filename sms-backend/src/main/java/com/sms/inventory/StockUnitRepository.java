package com.sms.inventory;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StockUnitRepository extends JpaRepository<StockUnit, UUID> {

    @Query("""
            select su from StockUnit su
            where (:storeId is null or su.currentStore.id = :storeId)
              and (:variantId is null or su.productVariant.id = :variantId)
              and (:availability is null or su.availabilityStatus = :availability)
            order by su.createdAt desc
            """)
    List<StockUnit> search(@Param("storeId") UUID storeId, @Param("variantId") UUID variantId,
                            @Param("availability") StockAvailability availability);

    List<StockUnit> findByReservedForSoItemIdIn(List<UUID> soItemIds);

    long countByCurrentStoreIdAndProductVariantIdAndAvailabilityStatus(
            UUID storeId, UUID variantId, StockAvailability availability);

    List<StockUnit> findByCurrentStoreIdAndProductVariantIdAndAvailabilityStatus(
            UUID storeId, UUID variantId, StockAvailability availability);

    boolean existsByManufacturerSerial(String manufacturerSerial);
}
