package com.sms.customer.crm.dto;

import com.sms.customer.crm.StoreVoucher;
import com.sms.customer.crm.VoucherType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record VoucherResponse(
        UUID id,
        String code,
        String title,
        VoucherType voucherType,
        BigDecimal discountValue,
        BigDecimal minOrderAmount,
        BigDecimal maxDiscountAmount,
        LocalDate validFrom,
        LocalDate validUntil,
        int maxUses,
        int timesUsed,
        boolean active,
        UUID assignedCustomerId,
        String assignedCustomerName,
        String notes
) {
    public static VoucherResponse from(StoreVoucher v) {
        String cName = v.getAssignedCustomer() != null ? v.getAssignedCustomer().getFullName() : null;
        return new VoucherResponse(
                v.getId(),
                v.getCode(),
                v.getTitle(),
                v.getVoucherType(),
                v.getDiscountValue(),
                v.getMinOrderAmount(),
                v.getMaxDiscountAmount(),
                v.getValidFrom(),
                v.getValidUntil(),
                v.getMaxUses(),
                v.getTimesUsed(),
                v.isActive(),
                v.getAssignedCustomer() != null ? v.getAssignedCustomer().getId() : null,
                cName,
                v.getNotes()
        );
    }
}

