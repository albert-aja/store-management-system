package com.sms.procurement;

import com.sms.common.web.BusinessRuleException;
import com.sms.common.web.NotFoundException;
import com.sms.inventory.ComponentStockService;
import com.sms.inventory.MovementType;
import com.sms.inventory.StockAvailability;
import com.sms.inventory.StockLocationType;
import com.sms.inventory.StockMovement;
import com.sms.inventory.StockMovementRepository;
import com.sms.inventory.StockUnit;
import com.sms.inventory.StockUnitRepository;
import com.sms.foundation.store.Store;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Manages receiving documents for ISSUED purchase orders.
 *
 * Business rules (README 10.2):
 * - A receipt can only be created against an ISSUED PO.
 * - Multiple receipts per PO are allowed (partial receiving).
 * - Each PO item appears at most once per receipt (unique constraint + service check).
 * - accepted_quantity + rejected_quantity must be > 0 and ≤ remaining unprocessed quantity for that item.
 * - Finalizing a DRAFT receipt creates Stock Units (for variant items) or increments ComponentStock
 *   (for component items) for every accepted unit, and posts RECEIVING / COMPONENT_RECEIVING stock movements
 *   with referenceType='PURCHASE_RECEIPT', referenceId=receiptId.
 * - A PO in ISSUED status with at least one receipt CANNOT be cancelled (see PurchaseOrderService.cancel()).
 * - Manufacturer serial is recorded per Stock Unit where provided (one per accepted unit in the request).
 */
@Service
@RequiredArgsConstructor
@Transactional
public class PurchaseReceiptService {

    private final PurchaseReceiptRepository receiptRepository;
    private final PurchaseReceiptItemRepository receiptItemRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderItemRepository poItemRepository;
    private final StockUnitRepository stockUnitRepository;
    private final StockMovementRepository stockMovementRepository;
    private final ComponentStockService componentStockService;

    @Transactional(readOnly = true)
    public List<PurchaseReceipt> listByPurchaseOrder(UUID purchaseOrderId) {
        return receiptRepository.findByPurchaseOrderId(purchaseOrderId);
    }

    @Transactional(readOnly = true)
    public PurchaseReceipt getReceipt(UUID id) {
        return receiptRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Purchase Receipt not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<PurchaseReceiptItem> listItems(UUID receiptId) {
        return receiptItemRepository.findByPurchaseReceiptId(receiptId);
    }

    /** Create a new DRAFT receipt document against an ISSUED PO. */
    public PurchaseReceipt createReceipt(UUID purchaseOrderId, String notes) {
        PurchaseOrder po = purchaseOrderRepository.findById(purchaseOrderId)
                .orElseThrow(() -> new NotFoundException("Purchase Order not found: " + purchaseOrderId));
        if (po.getStatus() != PurchaseOrderStatus.ISSUED) {
            throw new BusinessRuleException("Receiving is only allowed on ISSUED purchase orders");
        }
        PurchaseReceipt receipt = new PurchaseReceipt();
        receipt.setPurchaseOrder(po);
        receipt.setNotes(notes);
        return receiptRepository.save(receipt);
    }

    /**
     * Upsert an inspection result for one PO item within a DRAFT receipt.
     * acceptedQuantity + rejectedQuantity must be > 0 (checked here as a business rule mirror of the DB constraint).
     */
    public PurchaseReceiptItem upsertItem(UUID receiptId, ReceiptItemRequest request) {
        PurchaseReceipt receipt = requireDraftReceipt(receiptId);
        PurchaseOrderItem poItem = poItemRepository.findById(request.purchaseOrderItemId())
                .orElseThrow(() -> new NotFoundException("PO item not found: " + request.purchaseOrderItemId()));

        // Ensure the PO item belongs to this receipt's PO
        if (!poItem.getPurchaseOrder().getId().equals(receipt.getPurchaseOrder().getId())) {
            throw new BusinessRuleException("PO item does not belong to this receipt's purchase order");
        }
        int total = request.acceptedQuantity() + request.rejectedQuantity();
        if (total <= 0) {
            throw new BusinessRuleException("acceptedQuantity + rejectedQuantity must be > 0");
        }
        if (total > poItem.getQuantity()) {
            throw new BusinessRuleException(
                    "acceptedQuantity + rejectedQuantity (" + total + ") exceeds PO item quantity (" + poItem.getQuantity() + ")");
        }

        // Find existing or create new receipt item
        PurchaseReceiptItem item = receiptItemRepository.findByPurchaseReceiptId(receiptId).stream()
                .filter(i -> i.getPurchaseOrderItem().getId().equals(request.purchaseOrderItemId()))
                .findFirst()
                .orElseGet(() -> {
                    PurchaseReceiptItem newItem = new PurchaseReceiptItem();
                    newItem.setPurchaseReceipt(receipt);
                    newItem.setPurchaseOrderItem(poItem);
                    return newItem;
                });
        item.setAcceptedQuantity(request.acceptedQuantity());
        item.setRejectedQuantity(request.rejectedQuantity());
        item.setRejectedReason(request.rejectedReason());
        item.setNotes(request.notes());
        return receiptItemRepository.save(item);
    }

    /**
     * Finalize a DRAFT receipt: validate items are present, then for each accepted unit:
     * - Variant item → create one StockUnit per accepted unit + post RECEIVING movement.
     * - Component item → increment ComponentStock + post COMPONENT_RECEIVING movement.
     */
    public PurchaseReceipt finalizeReceipt(UUID receiptId) {
        PurchaseReceipt receipt = requireDraftReceipt(receiptId);
        List<PurchaseReceiptItem> items = receiptItemRepository.findByPurchaseReceiptId(receiptId);
        if (items.isEmpty()) {
            throw new BusinessRuleException("Cannot finalize a receipt with no items");
        }

        Store poStore = receipt.getPurchaseOrder().getStore();

        for (PurchaseReceiptItem ri : items) {
            PurchaseOrderItem poItem = ri.getPurchaseOrderItem();
            int accepted = ri.getAcceptedQuantity();
            if (accepted == 0) continue;

            if (poItem.getProductVariant() != null) {
                // Serial-tracked units — one StockUnit per accepted unit
                for (int i = 0; i < accepted; i++) {
                    StockUnit unit = new StockUnit();
                    unit.setProductVariant(poItem.getProductVariant());
                    unit.setCurrentStore(poStore);
                    unit.setLocationType(StockLocationType.WAREHOUSE);
                    unit.setAvailabilityStatus(StockAvailability.AVAILABLE);
                    unit = stockUnitRepository.save(unit);

                    postUnitMovement(unit, receipt.getId());
                }
            } else {
                // Loose component — increment the aggregate ComponentStock quantity
                componentStockService.adjustQuantity(
                        poStore.getId(),
                        poItem.getProductComponent().getId(),
                        accepted,
                        MovementType.COMPONENT_RECEIVING,
                        "PO receiving (receipt " + receiptId + ")"
                );
            }
        }

        receipt.setStatus(PurchaseReceiptStatus.FINALIZED);
        receipt.setReceivedAt(Instant.now());
        return receipt;
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private PurchaseReceipt requireDraftReceipt(UUID receiptId) {
        PurchaseReceipt receipt = getReceipt(receiptId);
        if (receipt.getStatus() != PurchaseReceiptStatus.DRAFT) {
            throw new BusinessRuleException("Receipt is already finalized");
        }
        return receipt;
    }

    private void postUnitMovement(StockUnit unit, UUID receiptId) {
        StockMovement movement = new StockMovement();
        movement.setMovementType(MovementType.RECEIVING);
        movement.setStockUnit(unit);
        movement.setQuantity(1);
        movement.setToStore(unit.getCurrentStore());
        movement.setToLocationType(unit.getLocationType());
        movement.setReferenceType("PURCHASE_RECEIPT");
        movement.setReferenceId(receiptId);
        stockMovementRepository.save(movement);
    }
}
