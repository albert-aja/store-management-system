package com.sms.finance;

import com.sms.finance.dto.HandoverCashRequest;
import com.sms.finance.dto.PaymentCustodyResponse;
import com.sms.finance.dto.VerifyCashRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/finance/custodies")
@RequiredArgsConstructor
public class PaymentCustodyController {

    private final FinanceService financeService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('FINANCE_MANAGE', 'FINANCE_COLLECT')")
    public List<PaymentCustodyResponse> listCustodies(
            @RequestParam(required = false) UUID holderId,
            @RequestParam(required = false) CustodyStatus status) {
        return financeService.listCustodies(holderId, status);
    }

    @PostMapping("/{id}/handover")
    @PreAuthorize("hasAnyAuthority('FINANCE_MANAGE', 'FINANCE_COLLECT')")
    public PaymentCustodyResponse handoverCash(
            @PathVariable UUID id,
            @Valid @RequestBody HandoverCashRequest req) {
        return financeService.handoverCash(id, req);
    }

    @PostMapping("/{id}/verify")
    @PreAuthorize("hasAuthority('FINANCE_MANAGE')")
    public PaymentCustodyResponse verifyCash(
            @PathVariable UUID id,
            @Valid @RequestBody VerifyCashRequest req) {
        return financeService.verifyCash(id, req);
    }
}
