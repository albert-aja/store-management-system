package com.sms.reporting.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CollectionAgingBucket {
    private String bucketName;
    private long installmentCount;
    private BigDecimal totalAmount;
    private double percentage;
}
