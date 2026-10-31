package com.sms.fleet;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VehicleMonthlyHealthCheckRepository extends JpaRepository<VehicleMonthlyHealthCheck, UUID> {
    List<VehicleMonthlyHealthCheck> findByVehicleIdOrderByCheckDateDescCreatedAtDesc(UUID vehicleId);
    Optional<VehicleMonthlyHealthCheck> findFirstByVehicleIdOrderByCheckDateDesc(UUID vehicleId);
    Optional<VehicleMonthlyHealthCheck> findByVehicleIdAndCheckMonth(UUID vehicleId, String checkMonth);
}

