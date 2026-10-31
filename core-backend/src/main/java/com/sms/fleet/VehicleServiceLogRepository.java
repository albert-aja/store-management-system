package com.sms.fleet;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VehicleServiceLogRepository extends JpaRepository<VehicleServiceLog, UUID> {
    List<VehicleServiceLog> findByVehicleIdOrderByServiceDateDescCreatedAtDesc(UUID vehicleId);
    Optional<VehicleServiceLog> findFirstByVehicleIdOrderByServiceDateDesc(UUID vehicleId);
}

