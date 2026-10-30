package com.sms.customer.crm.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record Customer360Response(
        UUID customerId,
        String fullName,
        String nik,
        String primaryPhone,
        String primaryEmail,
        String motherMaidenName,
        java.time.LocalDate birthDate,
        String birthPlace,
        String segment,
        String creditScoreGrade,
        int creditScorePoints,
        BigDecimal clvAmount,
        int totalOrdersCount,
        BigDecimal storeCreditBalance,
        int activeVouchersCount,
        int pendingPtpCount,
        int pendingFollowUpsCount,
        List<CustomerTagResponse> tags,
        List<TimelineEventResponse> timeline
) {}

