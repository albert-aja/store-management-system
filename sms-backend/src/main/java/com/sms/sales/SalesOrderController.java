package com.sms.sales;

import com.sms.common.security.SmsUserPrincipal;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sales-orders")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('SALES_ORDER_MANAGE')")
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    @GetMapping
    public List<SalesOrderResponse> search(@RequestParam(required = false) UUID storeId,
                                            @RequestParam(required = false) UUID customerId,
                                            @RequestParam(required = false) SalesOrderStatus status) {
        return salesOrderService.search(storeId, customerId, status).stream().map(SalesOrderResponse::from).toList();
    }

    @GetMapping("/{id}")
    public SalesOrderResponse getSalesOrder(@PathVariable UUID id) {
        return SalesOrderResponse.from(salesOrderService.getSalesOrder(id));
    }

    @PostMapping
    public SalesOrderResponse createDraft(@Valid @RequestBody SalesOrderRequest request,
                                           @AuthenticationPrincipal SmsUserPrincipal principal) {
        return SalesOrderResponse.from(salesOrderService.createDraft(
                request.storeId(), request.customerId(), principal.employeeId(), request.deliveryAddressId()));
    }

    @PutMapping("/{id}")
    public SalesOrderResponse updateDraftHeader(@PathVariable UUID id, @Valid @RequestBody UpdateSalesOrderRequest request) {
        return SalesOrderResponse.from(salesOrderService.updateDraftHeader(id, request.customerId(), request.deliveryAddressId()));
    }

    @GetMapping("/{id}/items")
    public List<SalesOrderItemResponse> listItems(@PathVariable UUID id) {
        return salesOrderService.listItems(id).stream().map(SalesOrderItemResponse::from).toList();
    }

    @PostMapping("/{id}/items")
    public SalesOrderItemResponse addItem(@PathVariable UUID id, @Valid @RequestBody SalesOrderItemRequest request) {
        return SalesOrderItemResponse.from(salesOrderService.addItem(
                id, request.productVariantId(), request.quantity(), request.paymentTermMonths(), request.finalPrice()));
    }

    @DeleteMapping("/items/{itemId}")
    public void removeItem(@PathVariable UUID itemId) {
        salesOrderService.removeItem(itemId);
    }

    @PostMapping("/{id}/submit-price-approval")
    public SalesOrderResponse submitForPriceApproval(@PathVariable UUID id, @Valid @RequestBody SubmitPriceApprovalRequest request,
                                                       @AuthenticationPrincipal SmsUserPrincipal principal) {
        return SalesOrderResponse.from(salesOrderService.submitForPriceApproval(id, request.workflowCode(), principal.employeeId()));
    }

    @PostMapping("/{id}/revise")
    public SalesOrderResponse revise(@PathVariable UUID id) {
        return SalesOrderResponse.from(salesOrderService.reviseAfterRejection(id));
    }

    @PostMapping("/{id}/release")
    public SalesOrderResponse release(@PathVariable UUID id) {
        return SalesOrderResponse.from(salesOrderService.release(id));
    }

    @PostMapping("/{id}/confirm")
    public SalesOrderResponse confirm(@PathVariable UUID id, @Valid @RequestBody ConfirmSalesOrderRequest request) {
        return SalesOrderResponse.from(salesOrderService.confirm(id, request.dpReceived()));
    }

    @PostMapping("/{id}/cancel")
    public SalesOrderResponse cancel(@PathVariable UUID id, @RequestBody(required = false) CancelSalesOrderRequest request) {
        String reason = request != null ? request.reason() : null;
        return SalesOrderResponse.from(salesOrderService.cancel(id, reason));
    }
}
