package com.sms.foundation.employee;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EmployeeRoleRepository extends JpaRepository<EmployeeRole, UUID> {

    List<EmployeeRole> findByEmployeeId(UUID employeeId);

    @org.springframework.data.jpa.repository.Query(
            "select er.role.code from EmployeeRole er where er.employee.authUserId = :authUserId")
    List<String> findRoleCodesByAuthUserId(UUID authUserId);

    @Query("""
            select distinct er.employee.id
            from EmployeeRole er
            join EmployeeStore es on es.employee.id = er.employee.id
            join RolePermission rp on rp.role.id = er.role.id
            where es.store.id = :storeId
              and rp.permission.code = :permissionCode
              and er.employee.employmentStatus = :employmentStatus
            """)
    List<UUID> findEmployeeIdsByStoreAndPermission(
            @Param("storeId") UUID storeId,
            @Param("permissionCode") String permissionCode,
            @Param("employmentStatus") EmploymentStatus employmentStatus);
}
