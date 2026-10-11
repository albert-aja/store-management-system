package com.sms.finance;

import com.sms.finance.dto.CreateReceivableRequest;
import com.sms.finance.dto.CustomerCreditSummaryResponse;
import com.sms.finance.dto.ReceivableResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/finance/receivables")
@RequiredArgsConstructor
public class ReceivableController {

    private final FinanceService financeService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('FINANCE_MANAGE')")
    public ReceivableResponse createReceivable(@Valid @RequestBody CreateReceivableRequest req) {
        return financeService.createReceivable(req);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('FINANCE_MANAGE', 'FINANCE_COLLECT')")
    public ReceivableResponse getReceivable(@PathVariable UUID id) {
        return financeService.getReceivable(id);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('FINANCE_MANAGE', 'FINANCE_COLLECT')")
    public List<ReceivableResponse> listReceivables(
            @RequestParam(required = false) UUID storeId,
            @RequestParam(required = false) UUID customerId,
            @RequestParam(required = false) ReceivableStatus status) {
        return financeService.listReceivables(storeId, customerId, status);
    }

    @GetMapping("/by-sales-order/{salesOrderId}")
    @PreAuthorize("hasAnyAuthority('FINANCE_MANAGE', 'FINANCE_COLLECT', 'SALES_ORDER_VIEW')")
    public List<ReceivableResponse> listBySalesOrder(@PathVariable UUID salesOrderId) {
        return financeService.listReceivablesBySalesOrder(salesOrderId);
    }

    @GetMapping("/customers/{customerId}/summary")
    @PreAuthorize("hasAnyAuthority('FINANCE_MANAGE', 'FINANCE_COLLECT')")
    public CustomerCreditSummaryResponse getCustomerCreditSummary(@PathVariable UUID customerId) {
        return financeService.getCustomerCreditSummary(customerId);
    }
}
