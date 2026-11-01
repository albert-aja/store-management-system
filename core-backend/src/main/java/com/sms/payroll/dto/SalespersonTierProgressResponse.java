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
public class SalespersonTierProgressResponse {
    private UUID salespersonId;
    private String salespersonName;
    private String salespersonCode;
    private long confirmedOrdersCount;
    private BigDecimal totalSalesVolume;
    private BigDecimal estimatedCommission;

    // Current Tier Details
    private String currentTierName;
    private BigDecimal currentCommissionRate;
    private BigDecimal currentTierMinVolume;
    private BigDecimal currentTierMaxVolume;
    private String currentTierColor;

    // Next Tier Targets
    private String nextTierName;
    private BigDecimal nextTierMinVolume;
    private BigDecimal volumeNeededForNextTier;
    private double progressPercentage;
}
