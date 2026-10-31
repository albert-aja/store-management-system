package com.sms.procurement;

import com.sms.common.dto.BulkOperationResult;
import com.sms.common.web.BusinessRuleException;
import com.sms.common.web.NotFoundException;
import com.sms.foundation.approval.ApprovalRequest;
import com.sms.foundation.approval.ApprovalRequestRepository;
import com.sms.foundation.approval.ApprovalService;
import com.sms.foundation.approval.ApprovalStatus;
import com.sms.foundation.numbering.DocumentNumberingService;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import com.sms.product.dto.ProductComponent;
import com.sms.product.dto.ProductVariant;
import com.sms.product.repository.ProductComponentRepository;
import com.sms.product.repository.ProductVariantRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class PurchaseOrderService {

    private static final String DOC_TYPE = "PO";

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderItemRepository itemRepository;
    private final StoreRepository storeRepository;
    private final SupplierRepository supplierRepository;
    private final ProductVariantRepository variantRepository;
    private final ProductComponentRepository componentRepository;
    private final ApprovalService approvalService;
    private final ApprovalRequestRepository approvalRequestRepository;
    private final DocumentNumberingService numberingService;
    private final PurchaseReceiptRepository receiptRepository;

    @Transactional(readOnly = true)
    public List<PurchaseOrder> search(UUID storeId, UUID supplierId, PurchaseOrderStatus status) {
        return purchaseOrderRepository.search(storeId, supplierId, status);
    }

    @Transactional(readOnly = true)
    public PurchaseOrder getPurchaseOrder(UUID id) {
        return purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Purchase Order not found: " + id));
    }

    public PurchaseOrder createDraft(UUID storeId, UUID supplierId, String notes) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new NotFoundException("Store not found: " + storeId));
        PurchaseOrder po = new PurchaseOrder();
        po.setStore(store);
        po.setSupplier(requireActiveSupplier(supplierId));
        po.setNotes(notes);
        return purchaseOrderRepository.save(po);
    }

    public PurchaseOrder updateDraftHeader(UUID id, UUID supplierId, String notes) {
        PurchaseOrder po = requireStatus(id, PurchaseOrderStatus.DRAFT);
        po.setSupplier(requireActiveSupplier(supplierId));
        po.setNotes(notes);
        return po;
    }

    private Supplier requireActiveSupplier(UUID supplierId) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new NotFoundException("Supplier not found: " + supplierId));
        if (!supplier.isActive()) {
            throw new BusinessRuleException("Supplier is inactive");
        }
        return supplier;
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderItem> listItems(UUID purchaseOrderId) {
        return itemRepository.findByPurchaseOrderId(purchaseOrderId);
    }

    public PurchaseOrderItem addItem(UUID purchaseOrderId, PurchaseOrderItemRequest request) {
        PurchaseOrder po = requireStatus(purchaseOrderId, PurchaseOrderStatus.DRAFT);
        boolean hasVariant = request.productVariantId() != null;
        boolean hasComponent = request.productComponentId() != null;
        if (hasVariant == hasComponent) {
            throw new BusinessRuleException("Provide exactly one of productVariantId or productComponentId");
        }
        PurchaseOrderItem item = new PurchaseOrderItem();
        item.setPurchaseOrder(po);
        if (hasVariant) {
            ProductVariant variant = variantRepository.findById(request.productVariantId())
                    .orElseThrow(() -> new NotFoundException("Variant not found: " + request.productVariantId()));
            item.setProductVariant(variant);
        } else {
            ProductComponent component = componentRepository.findById(request.productComponentId())
                    .orElseThrow(() -> new NotFoundException("Component not found: " + request.productComponentId()));
            item.setProductComponent(component);
        }
        item.setQuantity(request.quantity());
        item.setUnitCost(request.unitCost());
        item.setNotes(request.notes());
        return itemRepository.save(item);
    }

    /** Draft items are workspace data, not yet historical truth — hard delete is acceptable only here. */
    public void removeItem(UUID itemId) {
        PurchaseOrderItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Item not found: " + itemId));
        requireStatus(item.getPurchaseOrder().getId(), PurchaseOrderStatus.DRAFT);
        itemRepository.delete(item);
    }

    @Transactional(readOnly = true)
    public BigDecimal total(UUID purchaseOrderId) {
        return itemRepository.findByPurchaseOrderId(purchaseOrderId).stream()
                .map(i -> i.getUnitCost().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** README 10.1: Manager approval is normally required, subject to the configurable approval workflow. */
    public PurchaseOrder submitForApproval(UUID id, String workflowCode, UUID requestedBy) {
        PurchaseOrder po = requireStatus(id, PurchaseOrderStatus.DRAFT);
        if (itemRepository.findByPurchaseOrderId(id).isEmpty()) {
            throw new BusinessRuleException("Purchase Order has no items");
        }
        ApprovalRequest request = approvalService.createRequest(workflowCode, "PURCHASE_ORDER", id, requestedBy);
        po.setApprovalRequestId(request.getId());
        po.setStatus(PurchaseOrderStatus.PENDING_APPROVAL);
        return po;
    }

    /** A rejected PO returns to Draft for revision; it is never issued to the supplier. */
    public PurchaseOrder reviseAfterRejection(UUID id) {
        PurchaseOrder po = requireStatus(id, PurchaseOrderStatus.REJECTED);
        po.setApprovalRequestId(null);
        po.setStatus(PurchaseOrderStatus.DRAFT);
        return po;
    }

    /** Issue = approved and officially numbered; only then can the supplier be sent the order / goods received. */
    public PurchaseOrder issue(UUID id) {
        PurchaseOrder po = requireStatus(id, PurchaseOrderStatus.PENDING_APPROVAL);
        ApprovalRequest request = approvalRequestRepository.findById(po.getApprovalRequestId())
                .orElseThrow(() -> new NotFoundException("Approval request not found"));
        if (request.getStatus() == ApprovalStatus.REJECTED) {
            po.setStatus(PurchaseOrderStatus.REJECTED);
            throw new BusinessRuleException("Purchase Order approval was rejected; revise the Purchase Order");
        }
        if (request.getStatus() != ApprovalStatus.APPROVED) {
            throw new BusinessRuleException("Approval is still pending");
        }
        po.setNumber(numberingService.nextNumber(po.getStore().getId(), DOC_TYPE));
        po.setStatus(PurchaseOrderStatus.ISSUED);
        po.setIssuedAt(Instant.now());
        return po;
    }

    public PurchaseOrder cancel(UUID id, String reason) {
        PurchaseOrder po = getPurchaseOrder(id);
        if (po.getStatus() == PurchaseOrderStatus.CANCELLED) {
            throw new BusinessRuleException("Purchase Order is already cancelled");
        }
        if (po.getStatus() == PurchaseOrderStatus.ISSUED && receiptRepository.existsByPurchaseOrderId(id)) {
            throw new BusinessRuleException("Cannot cancel an ISSUED Purchase Order that already has receiving documents");
        }
        po.setStatus(PurchaseOrderStatus.CANCELLED);
        po.setCancelledAt(Instant.now());
        po.setCancelReason(reason);
        return po;
    }

    public BulkOperationResult bulkUpdateStatus(List<UUID> ids, String action, String reason) {
        List<BulkOperationResult.BulkItemResult> results = new ArrayList<>();
        for (UUID id : ids) {
            try {
                switch (action.toUpperCase()) {
                    case "ISSUE" -> {
                        issue(id);
                        results.add(new BulkOperationResult.BulkItemResult(id, true, "Issued successfully"));
                    }
                    case "CANCEL" -> {
                        cancel(id, reason != null ? reason : "Bulk cancellation");
                        results.add(new BulkOperationResult.BulkItemResult(id, true, "Cancelled successfully"));
                    }
                    default -> results.add(new BulkOperationResult.BulkItemResult(id, false, "Unsupported action: " + action));
                }
            } catch (Exception e) {
                results.add(new BulkOperationResult.BulkItemResult(id, false, e.getMessage()));
            }
        }
        return BulkOperationResult.of(results);
    }

    private PurchaseOrder requireStatus(UUID id, PurchaseOrderStatus expected) {
        PurchaseOrder po = getPurchaseOrder(id);
        if (po.getStatus() != expected) {
            throw new BusinessRuleException("Expected status " + expected + " but was " + po.getStatus());
        }
        return po;
    }
}
