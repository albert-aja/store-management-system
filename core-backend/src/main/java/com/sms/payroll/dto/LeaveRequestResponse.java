package com.sms.payroll.dto;

import com.sms.payroll.LeaveRequest;
import com.sms.payroll.LeaveStatus;
import com.sms.payroll.LeaveType;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LeaveRequestResponse {
    private UUID id;
    private String requestNumber;
    private UUID employeeId;
    private String employeeName;
    private LeaveType leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    private int daysCount;
    private String reason;
    private LeaveStatus status;
    private UUID approvedById;
    private String approvedByName;
    private String notes;
    private Instant createdAt;

    public static LeaveRequestResponse from(LeaveRequest r) {
        return LeaveRequestResponse.builder()
                .id(r.getId())
                .requestNumber(r.getRequestNumber())
                .employeeId(r.getEmployee().getId())
                .employeeName(r.getEmployee().getFullName())
                .leaveType(r.getLeaveType())
                .startDate(r.getStartDate())
                .endDate(r.getEndDate())
                .daysCount(r.getDaysCount())
                .reason(r.getReason())
                .status(r.getStatus())
                .approvedById(r.getApprovedBy() != null ? r.getApprovedBy().getId() : null)
                .approvedByName(r.getApprovedBy() != null ? r.getApprovedBy().getFullName() : null)
                .notes(r.getNotes())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
