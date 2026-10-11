package com.sms.payroll.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreatePayrollPeriodRequest {
    @NotBlank
    private String periodCode;

    @NotBlank
    private String name;

    private UUID storeId;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;

    @NotNull
    private LocalDate cutoffDate;

    @NotNull
    private LocalDate payoutDate;

    private String notes;
}
