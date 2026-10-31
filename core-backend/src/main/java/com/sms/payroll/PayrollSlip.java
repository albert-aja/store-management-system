package com.sms.payroll;

import com.sms.common.audit.BaseEntity;
import com.sms.foundation.employee.Employee;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "payroll_slip")
@Getter
@Setter
@NoArgsConstructor
public class PayrollSlip extends BaseEntity {

    @Column(name = "slip_number", nullable = false, unique = true, length = 50)
    private String slipNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payroll_period_id", nullable = false)
    private PayrollPeriod payrollPeriod;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "base_salary", nullable = false, precision = 15, scale = 2)
    private BigDecimal baseSalary = BigDecimal.ZERO;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal allowances = BigDecimal.ZERO;

    @Column(name = "sales_commission", nullable = false, precision = 15, scale = 2)
    private BigDecimal salesCommission = BigDecimal.ZERO;

    @Column(name = "collection_incentive", nullable = false, precision = 15, scale = 2)
    private BigDecimal collectionIncentive = BigDecimal.ZERO;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal deductions = BigDecimal.ZERO;

    @Column(name = "net_salary", nullable = false, precision = 15, scale = 2)
    private BigDecimal netSalary = BigDecimal.ZERO;

    @Column(name = "attendance_days", nullable = false)
    private int attendanceDays = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 30)
    private PayrollPaymentStatus paymentStatus = PayrollPaymentStatus.UNPAID;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(length = 500)
    private String notes;
}
