package com.sms.reporting.dto;

import java.math.BigDecimal;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CollectionAgingSummaryResponse {
    private List<CollectionAgingBucket> buckets;
    private BigDecimal totalReceivableBalance;
    private BigDecimal totalOverdueBalance;
    private BigDecimal totalCollectedCash;
    private long custodyDiscrepanciesCount;
}
