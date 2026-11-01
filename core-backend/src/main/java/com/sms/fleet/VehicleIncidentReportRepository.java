package com.sms.fleet;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VehicleIncidentReportRepository extends JpaRepository<VehicleIncidentReport, UUID> {

    List<VehicleIncidentReport> findByVehicleIdOrderByIncidentDateDesc(UUID vehicleId);

    List<VehicleIncidentReport> findByStatusOrderByIncidentDateDesc(String status);
}

