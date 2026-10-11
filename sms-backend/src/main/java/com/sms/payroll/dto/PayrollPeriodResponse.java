package com.sms.payroll.dto;

import com.sms.payroll.PayrollPeriod;
import com.sms.payroll.PayrollPeriodStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PayrollPeriodResponse {
    private UUID id;
    private String periodCode;
    private String name;
    private UUID storeId;
    private String storeName;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate cutoffDate;
    private LocalDate payoutDate;
    private PayrollPeriodStatus status;
    private UUID approvedById;
    private String approvedByName;
    private String notes;
    private int slipCount;
    private Instant createdAt;

    public static PayrollPeriodResponse from(PayrollPeriod p) {
        return PayrollPeriodResponse.builder()
                .id(p.getId())
                .periodCode(p.getPeriodCode())
                .name(p.getName())
                .storeId(p.getStore() != null ? p.getStore().getId() : null)
                .storeName(p.getStore() != null ? p.getStore().getName() : "All Stores")
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .cutoffDate(p.getCutoffDate())
                .payoutDate(p.getPayoutDate())
                .status(p.getStatus())
                .approvedById(p.getApprovedBy() != null ? p.getApprovedBy().getId() : null)
                .approvedByName(p.getApprovedBy() != null ? p.getApprovedBy().getFullName() : null)
                .notes(p.getNotes())
                .slipCount(p.getSlips() != null ? p.getSlips().size() : 0)
                .createdAt(p.getCreatedAt())
                .build();
    }
}
