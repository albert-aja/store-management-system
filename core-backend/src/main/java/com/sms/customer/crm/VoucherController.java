package com.sms.customer.crm;

import com.sms.customer.crm.dto.VoucherRequest;
import com.sms.customer.crm.dto.VoucherResponse;
import com.sms.customer.crm.dto.VoucherValidationResponse;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherService voucherService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('CUSTOMER_CRM_VIEW', 'STORE_CREDIT_MANAGE', 'SALES_ORDER_MANAGE')")
    public List<VoucherResponse> listVouchers(@RequestParam(required = false) Boolean activeOnly) {
        return voucherService.listVouchers(activeOnly);
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasAnyAuthority('CUSTOMER_CRM_VIEW', 'STORE_CREDIT_MANAGE')")
    public List<VoucherResponse> listCustomerVouchers(@PathVariable UUID customerId) {
        return voucherService.listCustomerVouchers(customerId);
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('STORE_CREDIT_MANAGE', 'ADMIN')")
    public VoucherResponse createVoucher(@Valid @RequestBody VoucherRequest request) {
        return voucherService.createVoucher(request);
    }

    @GetMapping("/validate")
    @PreAuthorize("hasAnyAuthority('CUSTOMER_CRM_VIEW', 'SALES_ORDER_MANAGE', 'CUSTOMER_MANAGE')")
    public VoucherValidationResponse validateVoucher(
            @RequestParam String code,
            @RequestParam BigDecimal orderAmount,
            @RequestParam(required = false) UUID customerId
    ) {
        return voucherService.validateVoucher(code, orderAmount, customerId);
    }
}

