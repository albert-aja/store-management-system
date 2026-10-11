package com.sms.delivery;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DeliveryTripRepository extends JpaRepository<DeliveryTrip, UUID> {

    List<DeliveryTrip> findByStoreIdOrderByScheduledDateDescCreatedAtDesc(UUID storeId);

    @Query("""
        select t from DeliveryTrip t
        where (:storeId is null or t.store.id = :storeId)
          and (:status is null or t.status = :status)
          and (:driverId is null or t.driver.id = :driverId)
        order by t.scheduledDate desc, t.createdAt desc
    """)
    List<DeliveryTrip> searchTrips(
            @Param("storeId") UUID storeId,
            @Param("status") DeliveryTripStatus status,
            @Param("driverId") UUID driverId
    );
}
