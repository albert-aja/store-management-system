package com.sms.procurement;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sms.common.web.BusinessRuleException;
import com.sms.foundation.approval.ApprovalRequest;
import com.sms.foundation.approval.ApprovalRequestRepository;
import com.sms.foundation.approval.ApprovalService;
import com.sms.foundation.approval.ApprovalStatus;
import com.sms.foundation.numbering.DocumentNumberingService;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import com.sms.product.repository.ProductComponentRepository;
import com.sms.product.repository.ProductVariantRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class PurchaseOrderServiceTest {

    private final PurchaseOrderRepository poRepository = mock(PurchaseOrderRepository.class);
    private final PurchaseOrderItemRepository itemRepository = mock(PurchaseOrderItemRepository.class);
    private final ApprovalRequestRepository approvalRequestRepository = mock(ApprovalRequestRepository.class);
    private final DocumentNumberingService numberingService = mock(DocumentNumberingService.class);

    private final PurchaseReceiptRepository receiptRepository = mock(PurchaseReceiptRepository.class);

    private final PurchaseOrderService service = new PurchaseOrderService(
            poRepository, itemRepository, mock(StoreRepository.class), mock(SupplierRepository.class),
            mock(ProductVariantRepository.class), mock(ProductComponentRepository.class),
            mock(ApprovalService.class), approvalRequestRepository, numberingService, receiptRepository);

    private PurchaseOrder pendingPo(UUID approvalId) {
        PurchaseOrder po = new PurchaseOrder();
        Store store = mock(Store.class);
        when(store.getId()).thenReturn(UUID.randomUUID());
        po.setStore(store);
        po.setStatus(PurchaseOrderStatus.PENDING_APPROVAL);
        po.setApprovalRequestId(approvalId);
        UUID id = UUID.randomUUID();
        when(poRepository.findById(id)).thenReturn(Optional.of(po));
        poIdHolder = id;
        return po;
    }

    private UUID poIdHolder;

    private ApprovalRequest approval(UUID id, ApprovalStatus status) {
        ApprovalRequest request = mock(ApprovalRequest.class);
        when(request.getStatus()).thenReturn(status);
        when(approvalRequestRepository.findById(id)).thenReturn(Optional.of(request));
        return request;
    }

    @Test
    void issueAssignsNumberWhenApproved() {
        UUID approvalId = UUID.randomUUID();
        PurchaseOrder po = pendingPo(approvalId);
        approval(approvalId, ApprovalStatus.APPROVED);
        when(numberingService.nextNumber(any(), any())).thenReturn("PO/ST/10/2026/0001");

        PurchaseOrder result = service.issue(poIdHolder);

        assertEquals(PurchaseOrderStatus.ISSUED, result.getStatus());
        assertEquals("PO/ST/10/2026/0001", po.getNumber());
    }

    @Test
    void issueBlockedWhilePending() {
        UUID approvalId = UUID.randomUUID();
        pendingPo(approvalId);
        approval(approvalId, ApprovalStatus.PENDING);

        assertThrows(BusinessRuleException.class, () -> service.issue(poIdHolder));
        verify(numberingService, never()).nextNumber(any(), any());
    }

    @Test
    void rejectedApprovalMovesPoToRejected() {
        UUID approvalId = UUID.randomUUID();
        PurchaseOrder po = pendingPo(approvalId);
        approval(approvalId, ApprovalStatus.REJECTED);

        assertThrows(BusinessRuleException.class, () -> service.issue(poIdHolder));
        assertEquals(PurchaseOrderStatus.REJECTED, po.getStatus());
    }

    @Test
    void addItemRequiresExactlyOneSubject() {
        PurchaseOrder po = new PurchaseOrder();
        UUID id = UUID.randomUUID();
        when(poRepository.findById(id)).thenReturn(Optional.of(po));

        PurchaseOrderItemRequest neither = new PurchaseOrderItemRequest(null, null, 1, java.math.BigDecimal.ONE, null);
        assertThrows(BusinessRuleException.class, () -> service.addItem(id, neither));
    }

    @Test
    void cancelIssuedPoWithReceiptsThrows() {
        PurchaseOrder po = new PurchaseOrder();
        po.setStatus(PurchaseOrderStatus.ISSUED);
        UUID id = UUID.randomUUID();
        when(poRepository.findById(id)).thenReturn(Optional.of(po));
        when(receiptRepository.existsByPurchaseOrderId(id)).thenReturn(true);

        assertThrows(BusinessRuleException.class, () -> service.cancel(id, "reason"));
    }

    @Test
    void cancelIssuedPoWithoutReceiptsSucceeds() {
        PurchaseOrder po = new PurchaseOrder();
        po.setStatus(PurchaseOrderStatus.ISSUED);
        UUID id = UUID.randomUUID();
        when(poRepository.findById(id)).thenReturn(Optional.of(po));
        when(receiptRepository.existsByPurchaseOrderId(id)).thenReturn(false);

        PurchaseOrder result = service.cancel(id, "reason");
        assertEquals(PurchaseOrderStatus.CANCELLED, result.getStatus());
    }
}
