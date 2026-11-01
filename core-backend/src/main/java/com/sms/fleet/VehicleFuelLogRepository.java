package com.sms.fleet;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface VehicleFuelLogRepository extends JpaRepository<VehicleFuelLog, UUID> {

    List<VehicleFuelLog> findByVehicleIdOrderByLogDateDesc(UUID vehicleId);

    @Query("""
        SELECT vfl FROM VehicleFuelLog vfl
        WHERE vfl.vehicle.id = :vehicleId
        ORDER BY vfl.logDate DESC, vfl.odometerKm DESC
    """)
    List<VehicleFuelLog> findLatestByVehicleId(@Param("vehicleId") UUID vehicleId);
}

