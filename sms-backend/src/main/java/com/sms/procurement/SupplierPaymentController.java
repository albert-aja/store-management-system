package com.sms.procurement;

import com.sms.common.security.SmsUserPrincipal;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/supplier-payments")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('PROCUREMENT_MANAGE')")
public class SupplierPaymentController {

    private final SupplierPaymentService paymentService;

    @GetMapping
    public List<SupplierPaymentResponse> listByPo(@RequestParam UUID purchaseOrderId) {
        return paymentService.listByPurchaseOrder(purchaseOrderId).stream()
                .map(SupplierPaymentResponse::from)
                .toList();
    }

    @GetMapping("/total")
    public BigDecimal totalPaid(@RequestParam UUID purchaseOrderId) {
        return paymentService.totalPaid(purchaseOrderId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SupplierPaymentResponse recordPayment(@Valid @RequestBody SupplierPaymentRequest request,
                                                  @AuthenticationPrincipal SmsUserPrincipal principal) {
        return SupplierPaymentResponse.from(
                paymentService.recordPayment(
                        request.purchaseOrderId(),
                        request.amount(),
                        request.paidAt(),
                        principal.employeeId(),
                        request.notes()
                )
        );
    }
}
