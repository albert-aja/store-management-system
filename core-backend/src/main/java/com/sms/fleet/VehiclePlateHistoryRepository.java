package com.sms.fleet;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VehiclePlateHistoryRepository extends JpaRepository<VehiclePlateHistory, UUID> {
    List<VehiclePlateHistory> findByVehicleIdOrderByChangeDateDescCreatedAtDesc(UUID vehicleId);
}

