package com.sms.fleet;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DriverLicenseRepository extends JpaRepository<DriverLicense, UUID> {

    List<DriverLicense> findByEmployeeIdOrderByExpiryDateAsc(UUID employeeId);

    Optional<DriverLicense> findByEmployeeIdAndLicenseType(UUID employeeId, DriverLicenseType licenseType);

    List<DriverLicense> findByExpiryDateLessThanEqual(LocalDate threshold);

    List<DriverLicense> findAllByOrderByExpiryDateAsc();
}

