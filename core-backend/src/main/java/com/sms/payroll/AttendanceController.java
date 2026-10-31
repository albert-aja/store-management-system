package com.sms.payroll;

import com.sms.payroll.dto.AttendanceRecordResponse;
import com.sms.payroll.dto.ClockInRequest;
import com.sms.payroll.dto.ClockOutRequest;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
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
@RequestMapping("/api/v1/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final PayrollService payrollService;

    @GetMapping
    public ResponseEntity<List<AttendanceRecordResponse>> listAttendance(
            @RequestParam(name = "storeId", required = false) UUID storeId,
            @RequestParam(name = "workDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate workDate) {
        return ResponseEntity.ok(payrollService.listAttendance(storeId, workDate));
    }

    @PostMapping("/clock-in")
    @PreAuthorize("hasAuthority('ATTENDANCE_RECORD') or hasRole('OWNER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<AttendanceRecordResponse> clockIn(@Valid @RequestBody ClockInRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(payrollService.clockIn(req));
    }

    @PostMapping("/{id}/clock-out")
    @PreAuthorize("hasAuthority('ATTENDANCE_RECORD') or hasRole('OWNER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<AttendanceRecordResponse> clockOut(
            @PathVariable UUID id,
            @RequestBody(required = false) ClockOutRequest req) {
        return ResponseEntity.ok(payrollService.clockOut(id, req));
    }
}
