package com.sms.payroll;

import com.sms.payroll.dto.ApproveLeaveRequest;
import com.sms.payroll.dto.CreateLeaveRequest;
import com.sms.payroll.dto.LeaveRequestResponse;
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
@RequestMapping("/api/v1/leave-requests")
@RequiredArgsConstructor
public class LeaveRequestController {

    private final PayrollService payrollService;

    @GetMapping
    public ResponseEntity<List<LeaveRequestResponse>> listLeaveRequests(
            @RequestParam(name = "employeeId", required = false) UUID employeeId,
            @RequestParam(name = "status", required = false) LeaveStatus status) {
        return ResponseEntity.ok(payrollService.listLeaveRequests(employeeId, status));
    }

    @PostMapping
    public ResponseEntity<LeaveRequestResponse> createLeaveRequest(
            @Valid @RequestBody CreateLeaveRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(payrollService.createLeaveRequest(req));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('HR_MANAGE') or hasRole('OWNER') or hasRole('MANAGER')")
    public ResponseEntity<LeaveRequestResponse> approveLeaveRequest(
            @PathVariable UUID id,
            @Valid @RequestBody ApproveLeaveRequest req) {
        return ResponseEntity.ok(payrollService.approveLeaveRequest(id, req));
    }
}
