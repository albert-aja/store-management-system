package com.sms.customer.crm.dto;

import com.sms.customer.crm.VoucherType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record VoucherRequest(
        @NotBlank String code,
        @NotBlank String title,
        @NotNull VoucherType voucherType,
        @NotNull @DecimalMin("1.00") BigDecimal discountValue,
        BigDecimal minOrderAmount,
        BigDecimal maxDiscountAmount,
        @NotNull LocalDate validFrom,
        @NotNull LocalDate validUntil,
        int maxUses,
        UUID assignedCustomerId,
        String notes
) {}

