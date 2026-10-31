package com.sms.customer;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CustomerResponse(
        UUID id,
        String fullName,
        String nik,
        String primaryPhone,
        String primaryEmail,
        boolean active,
        String segment,
        String creditScoreGrade,
        int creditScorePoints,
        BigDecimal clvAmount,
        int totalOrdersCount,
        String motherMaidenName,
        LocalDate birthDate,
        String birthPlace
) {
    public CustomerResponse(UUID id, String fullName, String nik, String primaryPhone, String primaryEmail, boolean active) {
        this(id, fullName, nik, primaryPhone, primaryEmail, active, "STANDARD", "B", 80, BigDecimal.ZERO, 0, null, null, null);
    }

    public static CustomerResponse from(Customer c) {
        return new CustomerResponse(
                c.getId(),
                c.getFullName(),
                c.getNik(),
                c.getPrimaryPhone(),
                c.getPrimaryEmail(),
                c.isActive(),
                c.getSegment(),
                c.getCreditScoreGrade(),
                c.getCreditScorePoints(),
                c.getClvAmount(),
                c.getTotalOrdersCount(),
                c.getMotherMaidenName(),
                c.getBirthDate(),
                c.getBirthPlace()
        );
    }
}
