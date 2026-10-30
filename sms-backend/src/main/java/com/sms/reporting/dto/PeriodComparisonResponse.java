package com.sms.reporting.dto;

import java.math.BigDecimal;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PeriodComparisonResponse {

    @Getter
    @Builder
    public static class PeriodMetric {
        private String periodLabel;
        private String startDate;
        private String endDate;
        private BigDecimal grossSales;
        private long confirmedOrders;
        private BigDecimal cashCollected;
        private long paymentsCount;
        private BigDecimal averageOrderValue;
    }

    @Getter
    @Builder
    public static class PeriodDelta {
        private BigDecimal salesDifference;
        private double salesGrowthPercentage;
        private BigDecimal collectionDifference;
        private double collectionGrowthPercentage;
        private long ordersDifference;
        private double ordersGrowthPercentage;
    }

    @Getter
    @Builder
    public static class DailyTrendItem {
        private String day;
        private int dayIndex;
        private BigDecimal primarySales;
        private BigDecimal comparisonSales;
        private BigDecimal primaryCollections;
        private BigDecimal comparisonCollections;
    }

    private PeriodMetric primary;
    private PeriodMetric comparison;
    private PeriodDelta delta;
    private List<DailyTrendItem> dailyTrends;
    private List<CollectionAgingBucket> primaryAging;
    private List<CollectionAgingBucket> comparisonAging;
}

