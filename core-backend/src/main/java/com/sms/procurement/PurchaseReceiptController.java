package com.sms.procurement;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/purchase-receipts")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('PROCUREMENT_MANAGE')")
public class PurchaseReceiptController {

    private final PurchaseReceiptService receiptService;

    @GetMapping
    public List<PurchaseReceiptResponse> listByPo(@RequestParam UUID purchaseOrderId) {
        return receiptService.listByPurchaseOrder(purchaseOrderId).stream()
                .map(PurchaseReceiptResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    public PurchaseReceiptResponse getReceipt(@PathVariable UUID id) {
        return PurchaseReceiptResponse.from(receiptService.getReceipt(id));
    }

    @GetMapping("/{id}/items")
    public List<PurchaseReceiptItemResponse> listItems(@PathVariable UUID id) {
        return receiptService.listItems(id).stream()
                .map(PurchaseReceiptItemResponse::from)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PurchaseReceiptResponse createReceipt(@Valid @RequestBody CreateReceiptRequest request) {
        return PurchaseReceiptResponse.from(
                receiptService.createReceipt(request.purchaseOrderId(), request.notes()));
    }

    @PutMapping("/{id}/items")
    public PurchaseReceiptItemResponse upsertItem(@PathVariable UUID id,
                                                   @Valid @RequestBody ReceiptItemRequest request) {
        return PurchaseReceiptItemResponse.from(receiptService.upsertItem(id, request));
    }

    @PostMapping("/{id}/finalize")
    public PurchaseReceiptResponse finalizeReceipt(@PathVariable UUID id) {
        return PurchaseReceiptResponse.from(receiptService.finalizeReceipt(id));
    }
}
