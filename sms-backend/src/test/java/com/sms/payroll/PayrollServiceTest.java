package com.sms.payroll;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sms.common.web.ConflictException;
import com.sms.foundation.employee.Employee;
import com.sms.foundation.employee.EmployeeRepository;
import com.sms.foundation.employee.EmployeeRole;
import com.sms.foundation.employee.EmployeeRoleRepository;
import com.sms.foundation.employee.EmployeeStore;
import com.sms.foundation.employee.EmployeeStoreRepository;
import com.sms.foundation.role.Role;
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
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class PayrollServiceTest {

    @Mock
    private EmployeeAttendanceRepository attendanceRepository;

    @Mock
    private LeaveRequestRepository leaveRequestRepository;

    @Mock
    private PayrollPeriodRepository payrollPeriodRepository;

    @Mock
    private PayrollSlipRepository payrollSlipRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private StoreRepository storeRepository;

    @Mock
    private EmployeeStoreRepository employeeStoreRepository;

    @Mock
    private EmployeeRoleRepository employeeRoleRepository;

    @Mock
    private DocumentNumberingService numberingService;

    @InjectMocks
    private PayrollService payrollService;

    private Store store;
    private Employee employee;
    private Employee manager;
    private UUID storeId;
    private UUID employeeId;
    private UUID managerId;

    @BeforeEach
    void setUp() {
        storeId = UUID.randomUUID();
        store = new Store();
        ReflectionTestUtils.setField(store, "id", storeId);
        store.setCode("ST01");
        store.setName("Main Store");

        employeeId = UUID.randomUUID();
        employee = new Employee();
        ReflectionTestUtils.setField(employee, "id", employeeId);
        employee.setEmployeeNumber("EMP001");
        employee.setFullName("Ahmad Sales");

        managerId = UUID.randomUUID();
        manager = new Employee();
        ReflectionTestUtils.setField(manager, "id", managerId);
        manager.setFullName("Budi Manager");
    }

    private <T> T withId(T entity, UUID id) {
        ReflectionTestUtils.setField(entity, "id", id);
        return entity;
    }

    @Test
    void clockIn_and_clockOut_success() {
        ClockInRequest inReq = new ClockInRequest();
        inReq.setEmployeeId(employeeId);
        inReq.setStoreId(storeId);
        inReq.setWorkDate(LocalDate.of(2026, 10, 8));

        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(attendanceRepository.findByEmployeeIdAndWorkDate(employeeId, LocalDate.of(2026, 10, 8)))
                .thenReturn(Optional.empty());
        when(attendanceRepository.save(any(EmployeeAttendance.class))).thenAnswer(inv -> {
            EmployeeAttendance a = inv.getArgument(0);
            return withId(a, UUID.randomUUID());
        });

        AttendanceRecordResponse inResp = payrollService.clockIn(inReq);
        assertThat(inResp.getStatus()).isEqualTo(AttendanceStatus.PRESENT);
        assertThat(inResp.getCheckInTime()).isNotNull();

        UUID attId = inResp.getId();
        EmployeeAttendance savedAtt = new EmployeeAttendance();
        ReflectionTestUtils.setField(savedAtt, "id", attId);
        savedAtt.setEmployee(employee);
        savedAtt.setStore(store);
        savedAtt.setWorkDate(LocalDate.of(2026, 10, 8));

        when(attendanceRepository.findById(attId)).thenReturn(Optional.of(savedAtt));

        ClockOutRequest outReq = new ClockOutRequest();
        outReq.setNotes("End of shift");
        AttendanceRecordResponse outResp = payrollService.clockOut(attId, outReq);
        assertThat(outResp.getCheckOutTime()).isNotNull();
    }

    @Test
    void createLeaveRequest_and_approveLeave() {
        CreateLeaveRequest req = new CreateLeaveRequest();
        req.setEmployeeId(employeeId);
        req.setLeaveType(LeaveType.ANNUAL);
        req.setStartDate(LocalDate.of(2026, 10, 10));
        req.setEndDate(LocalDate.of(2026, 10, 12));
        req.setDaysCount(3);
        req.setReason("Family gathering");

        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));
        when(leaveRequestRepository.save(any(LeaveRequest.class))).thenAnswer(inv -> {
            LeaveRequest l = inv.getArgument(0);
            return withId(l, UUID.randomUUID());
        });

        LeaveRequestResponse resp = payrollService.createLeaveRequest(req);
        assertThat(resp.getStatus()).isEqualTo(LeaveStatus.SUBMITTED);
        assertThat(resp.getDaysCount()).isEqualTo(3);

        UUID leaveId = resp.getId();
        LeaveRequest savedLeave = new LeaveRequest();
        ReflectionTestUtils.setField(savedLeave, "id", leaveId);
        savedLeave.setEmployee(employee);
        savedLeave.setStartDate(LocalDate.of(2026, 10, 10));
        savedLeave.setEndDate(LocalDate.of(2026, 10, 12));

        when(leaveRequestRepository.findById(leaveId)).thenReturn(Optional.of(savedLeave));
        when(employeeRepository.findById(managerId)).thenReturn(Optional.of(manager));
        when(attendanceRepository.findByEmployeeIdAndWorkDate(any(), any())).thenReturn(Optional.empty());

        EmployeeStore es = new EmployeeStore();
        es.setEmployee(employee);
        es.setStore(store);
        when(employeeStoreRepository.findByEmployeeId(employeeId)).thenReturn(List.of(es));

        ApproveLeaveRequest appReq = new ApproveLeaveRequest();
        appReq.setApprovedById(managerId);
        appReq.setApproved(true);

        LeaveRequestResponse appResp = payrollService.approveLeaveRequest(leaveId, appReq);
        assertThat(appResp.getStatus()).isEqualTo(LeaveStatus.APPROVED);
    }

    @Test
    void createPeriod_success() {
        CreatePayrollPeriodRequest req = new CreatePayrollPeriodRequest();
        req.setPeriodCode("PAY-202610");
        req.setName("October 2026 Payroll Run");
        req.setStartDate(LocalDate.of(2026, 9, 26));
        req.setEndDate(LocalDate.of(2026, 10, 25));
        req.setCutoffDate(LocalDate.of(2026, 10, 25));
        req.setPayoutDate(LocalDate.of(2026, 10, 28));

        when(payrollPeriodRepository.findByPeriodCode("PAY-202610")).thenReturn(Optional.empty());
        when(payrollPeriodRepository.save(any(PayrollPeriod.class))).thenAnswer(inv -> {
            PayrollPeriod p = inv.getArgument(0);
            return withId(p, UUID.randomUUID());
        });

        PayrollPeriodResponse resp = payrollService.createPeriod(req);
        assertThat(resp.getPeriodCode()).isEqualTo("PAY-202610");
        assertThat(resp.getStatus()).isEqualTo(PayrollPeriodStatus.DRAFT);
    }

    @Test
    void calculatePeriod_computesSalariesAndCommissions() {
        UUID periodId = UUID.randomUUID();
        PayrollPeriod period = new PayrollPeriod();
        ReflectionTestUtils.setField(period, "id", periodId);
        period.setPeriodCode("PAY-202610");
        period.setStore(store);
        period.setStartDate(LocalDate.of(2026, 9, 26));
        period.setEndDate(LocalDate.of(2026, 10, 25));
        period.setStatus(PayrollPeriodStatus.DRAFT);

        when(payrollPeriodRepository.findById(periodId)).thenReturn(Optional.of(period));
        when(employeeRepository.findAll()).thenReturn(List.of(employee));
        when(attendanceRepository.countAttendedDays(employeeId, period.getStartDate(), period.getEndDate()))
                .thenReturn(24L);
        when(payrollSlipRepository.findByPayrollPeriodIdAndEmployeeId(periodId, employeeId))
                .thenReturn(Optional.empty());
        when(payrollPeriodRepository.save(any(PayrollPeriod.class))).thenAnswer(inv -> inv.getArgument(0));

        EmployeeStore esCalc = new EmployeeStore();
        esCalc.setEmployee(employee);
        esCalc.setStore(store);
        when(employeeStoreRepository.findByEmployeeId(employeeId)).thenReturn(List.of(esCalc));

        Role r = new Role();
        r.setCode("CASHIER");
        EmployeeRole er = new EmployeeRole();
        er.setEmployee(employee);
        er.setRole(r);
        when(employeeRoleRepository.findByEmployeeId(employeeId)).thenReturn(List.of(er));

        CalculatePayrollRequest req = new CalculatePayrollRequest();
        req.setDefaultBaseSalary(new BigDecimal("5000000"));
        req.setDefaultAllowance(new BigDecimal("750000"));

        PayrollPeriodResponse resp = payrollService.calculatePeriod(periodId, req);
        assertThat(resp.getStatus()).isEqualTo(PayrollPeriodStatus.CALCULATED);

        verify(payrollSlipRepository).save(any(PayrollSlip.class));
    }

    @Test
    void finalizePeriod_freezesPayroll_recalculationFailsWithConflict() {
        UUID periodId = UUID.randomUUID();
        PayrollPeriod period = new PayrollPeriod();
        ReflectionTestUtils.setField(period, "id", periodId);
        period.setStatus(PayrollPeriodStatus.APPROVED);

        when(payrollPeriodRepository.findById(periodId)).thenReturn(Optional.of(period));
        when(payrollPeriodRepository.save(any(PayrollPeriod.class))).thenAnswer(inv -> inv.getArgument(0));

        PayrollPeriodResponse finResp = payrollService.finalizePeriod(periodId);
        assertThat(finResp.getStatus()).isEqualTo(PayrollPeriodStatus.FINALIZED);

        // Subsequent attempt to recalculate must fail due to freeze invariant (README 15.4)
        assertThatThrownBy(() -> payrollService.calculatePeriod(periodId, new CalculatePayrollRequest()))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("frozen");
    }

    @Test
    void paySlip_marksPaid() {
        UUID slipId = UUID.randomUUID();
        PayrollSlip slip = new PayrollSlip();
        ReflectionTestUtils.setField(slip, "id", slipId);
        slip.setPaymentStatus(PayrollPaymentStatus.UNPAID);

        PayrollPeriod period = new PayrollPeriod();
        period.setPeriodCode("PAY-202610");
        slip.setPayrollPeriod(period);
        slip.setEmployee(employee);

        when(payrollSlipRepository.findById(slipId)).thenReturn(Optional.of(slip));
        when(payrollSlipRepository.save(any(PayrollSlip.class))).thenAnswer(inv -> inv.getArgument(0));

        PayrollSlipResponse resp = payrollService.paySlip(slipId);
        assertThat(resp.getPaymentStatus()).isEqualTo(PayrollPaymentStatus.PAID);
        assertThat(resp.getPaidAt()).isNotNull();
    }
}
