package com.sms.procurement;

import com.sms.common.dto.BulkOperationResult;
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
@RequestMapping("/api/purchase-orders")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('PROCUREMENT_MANAGE')")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    @GetMapping
    public List<PurchaseOrderResponse> search(@RequestParam(required = false) UUID storeId,
                                              @RequestParam(required = false) UUID supplierId,
                                              @RequestParam(required = false) PurchaseOrderStatus status) {
        return purchaseOrderService.search(storeId, supplierId, status).stream().map(PurchaseOrderResponse::from).toList();
    }

    @GetMapping("/{id}")
    public PurchaseOrderResponse getPurchaseOrder(@PathVariable UUID id) {
        return PurchaseOrderResponse.from(purchaseOrderService.getPurchaseOrder(id));
    }

    @PostMapping
    public PurchaseOrderResponse createDraft(@Valid @RequestBody PurchaseOrderRequest request) {
        return PurchaseOrderResponse.from(
                purchaseOrderService.createDraft(request.storeId(), request.supplierId(), request.notes()));
    }

    @PutMapping("/{id}")
    public PurchaseOrderResponse updateDraftHeader(@PathVariable UUID id,
                                                   @Valid @RequestBody UpdatePurchaseOrderRequest request) {
        return PurchaseOrderResponse.from(
                purchaseOrderService.updateDraftHeader(id, request.supplierId(), request.notes()));
    }

    @GetMapping("/{id}/items")
    public List<PurchaseOrderItemResponse> listItems(@PathVariable UUID id) {
        return purchaseOrderService.listItems(id).stream().map(PurchaseOrderItemResponse::from).toList();
    }

    @PostMapping("/{id}/items")
    public PurchaseOrderItemResponse addItem(@PathVariable UUID id, @Valid @RequestBody PurchaseOrderItemRequest request) {
        return PurchaseOrderItemResponse.from(purchaseOrderService.addItem(id, request));
    }

    @DeleteMapping("/items/{itemId}")
    public void removeItem(@PathVariable UUID itemId) {
        purchaseOrderService.removeItem(itemId);
    }

    @PostMapping("/{id}/submit-approval")
    public PurchaseOrderResponse submitForApproval(@PathVariable UUID id,
                                                   @Valid @RequestBody SubmitPurchaseApprovalRequest request,
                                                   @AuthenticationPrincipal SmsUserPrincipal principal) {
        return PurchaseOrderResponse.from(
                purchaseOrderService.submitForApproval(id, request.workflowCode(), principal.employeeId()));
    }

    @PostMapping("/{id}/revise")
    public PurchaseOrderResponse revise(@PathVariable UUID id) {
        return PurchaseOrderResponse.from(purchaseOrderService.reviseAfterRejection(id));
    }

    @PostMapping("/{id}/issue")
    public PurchaseOrderResponse issue(@PathVariable UUID id) {
        return PurchaseOrderResponse.from(purchaseOrderService.issue(id));
    }

    @PostMapping("/{id}/cancel")
    public PurchaseOrderResponse cancel(@PathVariable UUID id,
                                        @RequestBody(required = false) CancelPurchaseOrderRequest request) {
        String reason = request != null ? request.reason() : null;
        return PurchaseOrderResponse.from(purchaseOrderService.cancel(id, reason));
    }

    @PostMapping("/bulk-status")
    public BulkOperationResult bulkUpdateStatus(@Valid @RequestBody BulkPurchaseOrderStatusRequest request) {
        return purchaseOrderService.bulkUpdateStatus(request.ids(), request.action(), request.reason());
    }
}
