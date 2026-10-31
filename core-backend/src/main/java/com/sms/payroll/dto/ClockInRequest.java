package com.sms.payroll.dto;

import com.sms.payroll.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClockInRequest {
    @NotNull
    private UUID employeeId;

    @NotNull
    private UUID storeId;

    @NotNull
    private LocalDate workDate;

    private AttendanceStatus status = AttendanceStatus.PRESENT;
    private String notes;
}
