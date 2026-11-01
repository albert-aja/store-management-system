package com.sms.payroll.dto;

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
public class CommissionTierDto {
    private UUID id;
    private String tierName;
    private BigDecimal minSalesVolume;
    private BigDecimal maxSalesVolume;
    private BigDecimal commissionRate;
    private String colorCode;
    private int displayOrder;
    private boolean isActive;
    private UUID storeId;
}
