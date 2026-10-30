package com.sms.payroll;

import com.sms.common.web.ConflictException;
import com.sms.common.web.NotFoundException;
import com.sms.foundation.employee.Employee;
import com.sms.foundation.employee.EmployeeRepository;
import com.sms.foundation.employee.EmployeeRole;
import com.sms.foundation.employee.EmployeeRoleRepository;
import com.sms.foundation.employee.EmployeeStore;
import com.sms.foundation.employee.EmployeeStoreRepository;
import com.sms.foundation.numbering.DocumentNumberingService;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import com.sms.payroll.dto.ApproveLeaveRequest;
import com.sms.payroll.dto.AttendanceRecordResponse;
import com.sms.payroll.dto.CalculatePayrollRequest;
import com.sms.payroll.dto.ClockInRequest;
import com.sms.payroll.dto.ClockOutRequest;
import com.sms.payroll.dto.CreateLeaveRequest;
import com.sms.payroll.dto.CreatePayrollPeriodRequest;
import com.sms.payroll.dto.LeaveRequestResponse;
import com.sms.payroll.dto.PayrollPeriodResponse;
import com.sms.payroll.dto.PayrollSlipResponse;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PayrollService {

    private static final String DOC_TYPE_LEAVE = "LEAVE";
    private static final String DOC_TYPE_PAYROLL_SLIP = "PAYROLL_SLIP";

    private final EmployeeAttendanceRepository attendanceRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final PayrollPeriodRepository payrollPeriodRepository;
    private final PayrollSlipRepository payrollSlipRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeStoreRepository employeeStoreRepository;
    private final EmployeeRoleRepository employeeRoleRepository;
    private final StoreRepository storeRepository;
    private final DocumentNumberingService numberingService;

    // --- 1. Attendance Management ---

    @Transactional
    public AttendanceRecordResponse clockIn(ClockInRequest req) {
        Employee employee = employeeRepository.findById(req.getEmployeeId())
                .orElseThrow(() -> new NotFoundException("Employee not found: " + req.getEmployeeId()));
        Store store = storeRepository.findById(req.getStoreId())
                .orElseThrow(() -> new NotFoundException("Store not found: " + req.getStoreId()));

        Optional<EmployeeAttendance> existing = attendanceRepository.findByEmployeeIdAndWorkDate(
                employee.getId(), req.getWorkDate()
        );

        EmployeeAttendance att;
        if (existing.isPresent()) {
            att = existing.get();
            att.setCheckInTime(Instant.now());
            att.setStatus(req.getStatus());
            if (req.getNotes() != null) {
                att.setNotes(req.getNotes());
            }
        } else {
            att = new EmployeeAttendance();
            att.setEmployee(employee);
            att.setStore(store);
            att.setWorkDate(req.getWorkDate());
            att.setCheckInTime(Instant.now());
            att.setStatus(req.getStatus() != null ? req.getStatus() : AttendanceStatus.PRESENT);
            att.setNotes(req.getNotes());
        }

        EmployeeAttendance saved = attendanceRepository.save(att);
        return AttendanceRecordResponse.from(saved);
    }

    @Transactional
    public AttendanceRecordResponse clockOut(UUID attendanceId, ClockOutRequest req) {
        EmployeeAttendance att = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new NotFoundException("Attendance record not found: " + attendanceId));

        att.setCheckOutTime(Instant.now());
        if (req != null && req.getNotes() != null) {
            att.setNotes(req.getNotes());
        }

        EmployeeAttendance saved = attendanceRepository.save(att);
        return AttendanceRecordResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<AttendanceRecordResponse> listAttendance(UUID storeId, LocalDate workDate) {
        List<EmployeeAttendance> list = (storeId != null && workDate != null)
                ? attendanceRepository.findByStoreIdAndWorkDate(storeId, workDate)
                : attendanceRepository.findAll();
        return list.stream().map(AttendanceRecordResponse::from).toList();
    }

    // --- 2. Leave Management ---

    @Transactional
    public LeaveRequestResponse createLeaveRequest(CreateLeaveRequest req) {
        Employee employee = employeeRepository.findById(req.getEmployeeId())
                .orElseThrow(() -> new NotFoundException("Employee not found: " + req.getEmployeeId()));

        String docNumber = "LEV-" + LocalDate.now().toString().replace("-", "") + "-"
                + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        LeaveRequest leave = new LeaveRequest();
        leave.setRequestNumber(docNumber);
        leave.setEmployee(employee);
        leave.setLeaveType(req.getLeaveType());
        leave.setStartDate(req.getStartDate());
        leave.setEndDate(req.getEndDate());
        leave.setDaysCount(req.getDaysCount());
        leave.setReason(req.getReason());
        leave.setStatus(LeaveStatus.SUBMITTED);

        LeaveRequest saved = leaveRequestRepository.save(leave);
        return LeaveRequestResponse.from(saved);
    }

    @Transactional
    public LeaveRequestResponse approveLeaveRequest(UUID leaveId, ApproveLeaveRequest req) {
        LeaveRequest leave = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new NotFoundException("Leave request not found: " + leaveId));
        Employee approver = employeeRepository.findById(req.getApprovedById())
                .orElseThrow(() -> new NotFoundException("Approver employee not found: " + req.getApprovedById()));

        if (req.isApproved()) {
            leave.setStatus(LeaveStatus.APPROVED);

            // Populate attendance roster as ON_LEAVE for leave period
            List<EmployeeStore> empStores = employeeStoreRepository.findByEmployeeId(leave.getEmployee().getId());
            Store empStore = !empStores.isEmpty() ? empStores.get(0).getStore() : null;

            if (empStore != null) {
                LocalDate cur = leave.getStartDate();
                while (!cur.isAfter(leave.getEndDate())) {
                    final LocalDate date = cur;
                    attendanceRepository.findByEmployeeIdAndWorkDate(leave.getEmployee().getId(), date)
                            .ifPresentOrElse(
                                    a -> {
                                        a.setStatus(AttendanceStatus.ON_LEAVE);
                                        attendanceRepository.save(a);
                                    },
                                    () -> {
                                        EmployeeAttendance newAtt = new EmployeeAttendance();
                                        newAtt.setEmployee(leave.getEmployee());
                                        newAtt.setStore(empStore);
                                        newAtt.setWorkDate(date);
                                        newAtt.setStatus(AttendanceStatus.ON_LEAVE);
                                        attendanceRepository.save(newAtt);
                                    }
                            );
                    cur = cur.plusDays(1);
                }
            }
        } else {
            leave.setStatus(LeaveStatus.REJECTED);
        }
        leave.setApprovedBy(approver);
        if (req.getNotes() != null) {
            leave.setNotes(req.getNotes());
        }

        LeaveRequest saved = leaveRequestRepository.save(leave);
        return LeaveRequestResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponse> listLeaveRequests(UUID employeeId, LeaveStatus status) {
        List<LeaveRequest> list;
        if (employeeId != null) {
            list = leaveRequestRepository.findByEmployeeId(employeeId);
        } else if (status != null) {
            list = leaveRequestRepository.findByStatus(status);
        } else {
            list = leaveRequestRepository.findAll();
        }
        return list.stream().map(LeaveRequestResponse::from).toList();
    }

    // --- 3. Payroll Processing & Freezing ---

    @Transactional
    public PayrollPeriodResponse createPeriod(CreatePayrollPeriodRequest req) {
        payrollPeriodRepository.findByPeriodCode(req.getPeriodCode().trim().toUpperCase())
                .ifPresent(existing -> {
                    throw new ConflictException("Payroll period code already exists: " + req.getPeriodCode());
                });

        Store store = req.getStoreId() != null
                ? storeRepository.findById(req.getStoreId()).orElse(null)
                : null;

        PayrollPeriod period = new PayrollPeriod();
        period.setPeriodCode(req.getPeriodCode().trim().toUpperCase());
        period.setName(req.getName().trim());
        period.setStore(store);
        period.setStartDate(req.getStartDate());
        period.setEndDate(req.getEndDate());
        period.setCutoffDate(req.getCutoffDate());
        period.setPayoutDate(req.getPayoutDate());
        period.setStatus(PayrollPeriodStatus.DRAFT);
        period.setNotes(req.getNotes());

        PayrollPeriod saved = payrollPeriodRepository.save(period);
        return PayrollPeriodResponse.from(saved);
    }

    @Transactional
    public PayrollPeriodResponse calculatePeriod(UUID periodId, CalculatePayrollRequest req) {
        PayrollPeriod period = payrollPeriodRepository.findById(periodId)
                .orElseThrow(() -> new NotFoundException("Payroll period not found: " + periodId));

        // Enforce freeze invariant (README 15.4)
        if (period.getStatus() == PayrollPeriodStatus.FINALIZED) {
            throw new ConflictException("Payroll period is FINALIZED and frozen. It cannot be recalculated.");
        }

        List<Employee> employees = (period.getStore() != null)
                ? employeeRepository.findAll().stream()
                        .filter(e -> employeeStoreRepository.findByEmployeeId(e.getId()).stream()
                                .anyMatch(es -> es.getStore().getId().equals(period.getStore().getId())))
                        .toList()
                : employeeRepository.findAll();

        BigDecimal base = (req != null && req.getDefaultBaseSalary() != null)
                ? req.getDefaultBaseSalary()
                : new BigDecimal("4500000");
        BigDecimal allowance = (req != null && req.getDefaultAllowance() != null)
                ? req.getDefaultAllowance()
                : new BigDecimal("500000");

        for (Employee emp : employees) {
            long attendedDays = attendanceRepository.countAttendedDays(
                    emp.getId(), period.getStartDate(), period.getEndDate()
            );

            // Compute commissions & incentives based on roles
            BigDecimal salesCommission = BigDecimal.ZERO;
            BigDecimal collectionIncentive = BigDecimal.ZERO;

            List<EmployeeRole> roles = employeeRoleRepository.findByEmployeeId(emp.getId());
            boolean isSales = roles.stream().anyMatch(r -> "CASHIER".equals(r.getRole().getCode()) || "ADMIN".equals(r.getRole().getCode()));
            boolean isCollector = roles.stream().anyMatch(r -> "COLLECTOR".equals(r.getRole().getCode()));

            if (isSales) {
                // Tiered performance commission demonstration rate: standard base 2% bonus or fixed tier
                salesCommission = new BigDecimal("750000");
            }
            if (isCollector) {
                // Standard collection visit & recovery incentive
                collectionIncentive = new BigDecimal("600000");
            }

            BigDecimal deductions = BigDecimal.ZERO;
            // Prorate base salary if low attendance (standard 25 working days per month base)
            BigDecimal effectiveBase = base;
            if (attendedDays > 0 && attendedDays < 20) {
                effectiveBase = base.multiply(BigDecimal.valueOf(attendedDays))
                        .divide(BigDecimal.valueOf(25), 2, RoundingMode.HALF_UP);
            }

            BigDecimal net = effectiveBase.add(allowance)
                    .add(salesCommission)
                    .add(collectionIncentive)
                    .subtract(deductions);

            Optional<PayrollSlip> slipOpt = payrollSlipRepository.findByPayrollPeriodIdAndEmployeeId(
                    period.getId(), emp.getId()
            );

            PayrollSlip slip = slipOpt.orElseGet(PayrollSlip::new);
            if (slip.getSlipNumber() == null) {
                slip.setSlipNumber("SLIP/" + period.getPeriodCode() + "/" + emp.getEmployeeNumber());
                slip.setPayrollPeriod(period);
                slip.setEmployee(emp);
            }

            slip.setBaseSalary(effectiveBase);
            slip.setAllowances(allowance);
            slip.setSalesCommission(salesCommission);
            slip.setCollectionIncentive(collectionIncentive);
            slip.setDeductions(deductions);
            slip.setNetSalary(net);
            slip.setAttendanceDays((int) attendedDays);
            slip.setPaymentStatus(PayrollPaymentStatus.UNPAID);

            payrollSlipRepository.save(slip);
        }

        period.setStatus(PayrollPeriodStatus.CALCULATED);
        PayrollPeriod saved = payrollPeriodRepository.save(period);
        return PayrollPeriodResponse.from(saved);
    }

    @Transactional
    public PayrollPeriodResponse approvePeriod(UUID periodId, UUID approverId) {
        PayrollPeriod period = payrollPeriodRepository.findById(periodId)
                .orElseThrow(() -> new NotFoundException("Payroll period not found: " + periodId));
        Employee approver = employeeRepository.findById(approverId)
                .orElseThrow(() -> new NotFoundException("Approver employee not found: " + approverId));

        if (period.getStatus() == PayrollPeriodStatus.FINALIZED) {
            throw new ConflictException("Payroll period is already finalized.");
        }

        period.setStatus(PayrollPeriodStatus.APPROVED);
        period.setApprovedBy(approver);
        PayrollPeriod saved = payrollPeriodRepository.save(period);
        return PayrollPeriodResponse.from(saved);
    }

    @Transactional
    public PayrollPeriodResponse finalizePeriod(UUID periodId) {
        PayrollPeriod period = payrollPeriodRepository.findById(periodId)
                .orElseThrow(() -> new NotFoundException("Payroll period not found: " + periodId));

        if (period.getStatus() != PayrollPeriodStatus.APPROVED) {
            throw new ConflictException("Payroll period must be APPROVED before finalization. Current: " + period.getStatus());
        }

        // Freeze invariant (README 15.4): once finalized, slips are immutable
        period.setStatus(PayrollPeriodStatus.FINALIZED);
        PayrollPeriod saved = payrollPeriodRepository.save(period);
        return PayrollPeriodResponse.from(saved);
    }

    @Transactional
    public PayrollSlipResponse paySlip(UUID slipId) {
        PayrollSlip slip = payrollSlipRepository.findById(slipId)
                .orElseThrow(() -> new NotFoundException("Payroll slip not found: " + slipId));

        slip.setPaymentStatus(PayrollPaymentStatus.PAID);
        slip.setPaidAt(Instant.now());
        PayrollSlip saved = payrollSlipRepository.save(slip);
        return PayrollSlipResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<PayrollPeriodResponse> listPeriods(UUID storeId) {
        List<PayrollPeriod> list = (storeId != null)
                ? payrollPeriodRepository.findByStoreId(storeId)
                : payrollPeriodRepository.findAll();
        return list.stream().map(PayrollPeriodResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<PayrollSlipResponse> getPeriodSlips(UUID periodId) {
        List<PayrollSlip> slips = payrollSlipRepository.findByPayrollPeriodId(periodId);
        return slips.stream().map(PayrollSlipResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<PayrollSlipResponse> getEmployeeSlips(UUID employeeId) {
        List<PayrollSlip> slips = payrollSlipRepository.findByEmployeeId(employeeId);
        return slips.stream().map(PayrollSlipResponse::from).toList();
    }
}
