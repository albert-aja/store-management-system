package com.sms.foundation.employee;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {

    Optional<Employee> findByAuthUserId(UUID authUserId);

    boolean existsByEmployeeNumber(String employeeNumber);

    boolean existsByNik(String nik);
}
