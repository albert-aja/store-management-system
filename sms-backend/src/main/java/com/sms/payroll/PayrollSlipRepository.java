package com.sms.payroll;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PayrollSlipRepository extends JpaRepository<PayrollSlip, UUID> {
    List<PayrollSlip> findByPayrollPeriodId(UUID payrollPeriodId);
    Optional<PayrollSlip> findByPayrollPeriodIdAndEmployeeId(UUID payrollPeriodId, UUID employeeId);
    List<PayrollSlip> findByEmployeeId(UUID employeeId);
}
