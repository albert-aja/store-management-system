package com.sms.payroll.dto;

import com.sms.payroll.PayrollPaymentStatus;
import com.sms.payroll.PayrollSlip;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PayrollSlipResponse {
    private UUID id;
    private String slipNumber;
    private UUID payrollPeriodId;
    private String periodCode;
    private UUID employeeId;
    private String employeeName;
    private String employeeCode;
    private BigDecimal baseSalary;
    private BigDecimal allowances;
    private BigDecimal salesCommission;
    private BigDecimal collectionIncentive;
    private BigDecimal deductions;
    private BigDecimal netSalary;
    private int attendanceDays;
    private PayrollPaymentStatus paymentStatus;
    private Instant paidAt;
    private String notes;
    private Instant createdAt;

    public static PayrollSlipResponse from(PayrollSlip s) {
        return PayrollSlipResponse.builder()
                .id(s.getId())
                .slipNumber(s.getSlipNumber())
                .payrollPeriodId(s.getPayrollPeriod().getId())
                .periodCode(s.getPayrollPeriod().getPeriodCode())
                .employeeId(s.getEmployee().getId())
                .employeeName(s.getEmployee().getFullName())
                .employeeCode(s.getEmployee().getEmployeeNumber())
                .baseSalary(s.getBaseSalary())
                .allowances(s.getAllowances())
                .salesCommission(s.getSalesCommission())
                .collectionIncentive(s.getCollectionIncentive())
                .deductions(s.getDeductions())
                .netSalary(s.getNetSalary())
                .attendanceDays(s.getAttendanceDays())
                .paymentStatus(s.getPaymentStatus())
                .paidAt(s.getPaidAt())
                .notes(s.getNotes())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
