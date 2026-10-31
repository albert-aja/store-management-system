package com.sms.payroll.dto;

import com.sms.payroll.LeaveType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateLeaveRequest {
    @NotNull
    private UUID employeeId;

    @NotNull
    private LeaveType leaveType = LeaveType.ANNUAL;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;

    @Min(1)
    private int daysCount = 1;

    @NotBlank
    private String reason;
}
