package com.sms.payroll;

import com.sms.payroll.dto.CalculatePayrollRequest;
import com.sms.payroll.dto.CreatePayrollPeriodRequest;
import com.sms.payroll.dto.PayrollPeriodResponse;
import com.sms.payroll.dto.PayrollSlipResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payroll")
@RequiredArgsConstructor
public class PayrollController {

    private final PayrollService payrollService;

    @GetMapping("/periods")
    public ResponseEntity<List<PayrollPeriodResponse>> listPeriods(
            @RequestParam(name = "storeId", required = false) UUID storeId) {
        return ResponseEntity.ok(payrollService.listPeriods(storeId));
    }

    @PostMapping("/periods")
    @PreAuthorize("hasAuthority('PAYROLL_MANAGE') or hasRole('OWNER') or hasRole('MANAGER')")
    public ResponseEntity<PayrollPeriodResponse> createPeriod(
            @Valid @RequestBody CreatePayrollPeriodRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(payrollService.createPeriod(req));
    }

    @PostMapping("/periods/{id}/calculate")
    @PreAuthorize("hasAuthority('PAYROLL_MANAGE') or hasRole('OWNER') or hasRole('MANAGER')")
    public ResponseEntity<PayrollPeriodResponse> calculatePeriod(
            @PathVariable UUID id,
            @RequestBody(required = false) CalculatePayrollRequest req) {
        return ResponseEntity.ok(payrollService.calculatePeriod(id, req));
    }

    @PostMapping("/periods/{id}/approve")
    @PreAuthorize("hasAuthority('PAYROLL_MANAGE') or hasRole('OWNER') or hasRole('MANAGER')")
    public ResponseEntity<PayrollPeriodResponse> approvePeriod(
            @PathVariable UUID id,
            @RequestParam(name = "approverId") UUID approverId) {
        return ResponseEntity.ok(payrollService.approvePeriod(id, approverId));
    }

    @PostMapping("/periods/{id}/finalize")
    @PreAuthorize("hasAuthority('PAYROLL_MANAGE') or hasRole('OWNER') or hasRole('MANAGER')")
    public ResponseEntity<PayrollPeriodResponse> finalizePeriod(@PathVariable UUID id) {
        return ResponseEntity.ok(payrollService.finalizePeriod(id));
    }

    @GetMapping("/periods/{id}/slips")
    public ResponseEntity<List<PayrollSlipResponse>> getPeriodSlips(@PathVariable UUID id) {
        return ResponseEntity.ok(payrollService.getPeriodSlips(id));
    }

    @PostMapping("/slips/{id}/pay")
    @PreAuthorize("hasAuthority('PAYROLL_MANAGE') or hasRole('OWNER') or hasRole('MANAGER')")
    public ResponseEntity<PayrollSlipResponse> paySlip(@PathVariable UUID id) {
        return ResponseEntity.ok(payrollService.paySlip(id));
    }
}
