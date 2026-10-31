package com.sms.foundation.employee;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployeeReportingRepository extends JpaRepository<EmployeeReporting, UUID> {

    Optional<EmployeeReporting> findByEmployeeId(UUID employeeId);
}
