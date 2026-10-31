package com.sms.payroll.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApproveLeaveRequest {
    @NotNull
    private UUID approvedById;

    private boolean approved = true;
    private String notes;
}
