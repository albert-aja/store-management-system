package com.sms.payroll.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommissionTierRequest {
    @NotBlank(message = "Tier name is required")
    private String tierName;

    @NotNull(message = "Minimum sales volume is required")
    @DecimalMin(value = "0.00", message = "Minimum sales volume must be >= 0")
    private BigDecimal minSalesVolume;

    private BigDecimal maxSalesVolume;

    @NotNull(message = "Commission rate is required")
    @DecimalMin(value = "0.0000", message = "Commission rate must be >= 0")
    private BigDecimal commissionRate;

    private String colorCode;

    private Integer displayOrder;

    private Boolean isActive;

    private UUID storeId;
}
