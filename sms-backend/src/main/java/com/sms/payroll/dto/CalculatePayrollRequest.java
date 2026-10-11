package com.sms.payroll.dto;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CalculatePayrollRequest {
    private BigDecimal defaultBaseSalary = new BigDecimal("4500000");
    private BigDecimal defaultAllowance = new BigDecimal("500000");
    private UUID calculatedById;
}
