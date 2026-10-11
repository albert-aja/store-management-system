package com.sms.payroll.dto;

import com.sms.payroll.AttendanceStatus;
import com.sms.payroll.EmployeeAttendance;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AttendanceRecordResponse {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private UUID storeId;
    private String storeName;
    private LocalDate workDate;
    private Instant checkInTime;
    private Instant checkOutTime;
    private AttendanceStatus status;
    private String notes;

    public static AttendanceRecordResponse from(EmployeeAttendance a) {
        return AttendanceRecordResponse.builder()
                .id(a.getId())
                .employeeId(a.getEmployee().getId())
                .employeeName(a.getEmployee().getFullName())
                .storeId(a.getStore().getId())
                .storeName(a.getStore().getName())
                .workDate(a.getWorkDate())
                .checkInTime(a.getCheckInTime())
                .checkOutTime(a.getCheckOutTime())
                .status(a.getStatus())
                .notes(a.getNotes())
                .build();
    }
}
