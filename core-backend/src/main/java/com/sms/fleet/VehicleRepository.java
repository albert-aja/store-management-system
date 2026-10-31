package com.sms.fleet;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {
    Optional<Vehicle> findByRegistrationNumberIgnoreCase(String registrationNumber);
    List<Vehicle> findByStoreId(UUID storeId);
    List<Vehicle> findByStatus(VehicleStatus status);
    List<Vehicle> findByStoreIdAndStatus(UUID storeId, VehicleStatus status);
}

