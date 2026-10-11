package com.sms.payroll;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeAttendanceRepository extends JpaRepository<EmployeeAttendance, UUID> {
    Optional<EmployeeAttendance> findByEmployeeIdAndWorkDate(UUID employeeId, LocalDate workDate);
    List<EmployeeAttendance> findByStoreIdAndWorkDate(UUID storeId, LocalDate workDate);

    @Query("SELECT a FROM EmployeeAttendance a WHERE a.employee.id = :employeeId " +
           "AND a.workDate >= :startDate AND a.workDate <= :endDate")
    List<EmployeeAttendance> findByEmployeeAndDateRange(
            @Param("employeeId") UUID employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(a) FROM EmployeeAttendance a WHERE a.employee.id = :employeeId " +
           "AND a.workDate >= :startDate AND a.workDate <= :endDate " +
           "AND a.status IN ('PRESENT', 'LATE', 'HALF_DAY')")
    long countAttendedDays(
            @Param("employeeId") UUID employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
