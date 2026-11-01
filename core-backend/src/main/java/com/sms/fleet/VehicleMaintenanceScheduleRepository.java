package com.sms.fleet;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VehicleMaintenanceScheduleRepository extends JpaRepository<VehicleMaintenanceSchedule, UUID> {

    List<VehicleMaintenanceSchedule> findByVehicleIdOrderByScheduledDateDesc(UUID vehicleId);

    List<VehicleMaintenanceSchedule> findByStatusOrderByScheduledDateAsc(String status);
}

