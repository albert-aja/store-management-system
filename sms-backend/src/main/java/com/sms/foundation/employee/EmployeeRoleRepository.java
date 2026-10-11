package com.sms.foundation.employee;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployeeRoleRepository extends JpaRepository<EmployeeRole, UUID> {

    List<EmployeeRole> findByEmployeeId(UUID employeeId);

    @org.springframework.data.jpa.repository.Query(
            "select er.role.code from EmployeeRole er where er.employee.authUserId = :authUserId")
    List<String> findRoleCodesByAuthUserId(UUID authUserId);
}
