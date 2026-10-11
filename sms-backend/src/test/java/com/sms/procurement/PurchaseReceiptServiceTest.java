package com.sms.procurement;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sms.common.web.BusinessRuleException;
import com.sms.foundation.store.Store;
import com.sms.inventory.ComponentStockService;
import com.sms.inventory.MovementType;
import com.sms.inventory.StockMovement;
import com.sms.inventory.StockMovementRepository;
import com.sms.inventory.StockUnit;
import com.sms.inventory.StockUnitRepository;
import com.sms.product.dto.ProductComponent;
import com.sms.product.dto.ProductVariant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class PurchaseReceiptServiceTest {

    private final PurchaseReceiptRepository receiptRepository = mock(PurchaseReceiptRepository.class);
    private final PurchaseReceiptItemRepository receiptItemRepository = mock(PurchaseReceiptItemRepository.class);
    private final PurchaseOrderRepository poRepository = mock(PurchaseOrderRepository.class);
    private final PurchaseOrderItemRepository poItemRepository = mock(PurchaseOrderItemRepository.class);
    private final StockUnitRepository stockUnitRepository = mock(StockUnitRepository.class);
    private final StockMovementRepository stockMovementRepository = mock(StockMovementRepository.class);
    private final ComponentStockService componentStockService = mock(ComponentStockService.class);

    private final PurchaseReceiptService service = new PurchaseReceiptService(
            receiptRepository, receiptItemRepository, poRepository, poItemRepository,
            stockUnitRepository, stockMovementRepository, componentStockService);

    // ── helpers ────────────────────────────────────────────────────────────

    private PurchaseOrder issuedPo() {
        Store store = mock(Store.class);
        when(store.getId()).thenReturn(UUID.randomUUID());
        Supplier supplier = mock(Supplier.class);
        PurchaseOrder po = mock(PurchaseOrder.class);
        UUID id = UUID.randomUUID();
        when(po.getId()).thenReturn(id);
        when(po.getStore()).thenReturn(store);
        when(po.getSupplier()).thenReturn(supplier);
        when(po.getStatus()).thenReturn(PurchaseOrderStatus.ISSUED);
        when(poRepository.findById(id)).thenReturn(Optional.of(po));
        poIdHolder = id;
        return po;
    }

    private UUID poIdHolder;

    private PurchaseReceipt draftReceipt(PurchaseOrder po) {
        PurchaseReceipt receipt = new PurchaseReceipt();
        receipt.setPurchaseOrder(po);
        UUID id = UUID.randomUUID();
        when(receiptRepository.findById(id)).thenReturn(Optional.of(receipt));
        receiptIdHolder = id;
        return receipt;
    }

    private UUID receiptIdHolder;

    private PurchaseOrderItem variantItem(PurchaseOrder po, int qty) {
        ProductVariant variant = mock(ProductVariant.class);
        when(variant.getId()).thenReturn(UUID.randomUUID());
        PurchaseOrderItem item = new PurchaseOrderItem();
        item.setPurchaseOrder(po);
        item.setProductVariant(variant);
        item.setQuantity(qty);
        item.setUnitCost(java.math.BigDecimal.TEN);
        UUID id = UUID.randomUUID();
        when(poItemRepository.findById(id)).thenReturn(Optional.of(item));
        poItemIdHolder = id;
        return item;
    }

    private PurchaseOrderItem componentItem(PurchaseOrder po, int qty) {
        ProductComponent component = mock(ProductComponent.class);
        when(component.getId()).thenReturn(UUID.randomUUID());
        PurchaseOrderItem item = new PurchaseOrderItem();
        item.setPurchaseOrder(po);
        item.setProductComponent(component);
        item.setQuantity(qty);
        item.setUnitCost(java.math.BigDecimal.TEN);
        UUID id = UUID.randomUUID();
        when(poItemRepository.findById(id)).thenReturn(Optional.of(item));
        poItemIdHolder = id;
        return item;
    }

    private UUID poItemIdHolder;

    // ── tests ──────────────────────────────────────────────────────────────

    @Test
    void createReceiptBlockedOnNonIssuedPo() {
        PurchaseOrder po = new PurchaseOrder();
        po.setStatus(PurchaseOrderStatus.DRAFT);
        UUID poId = UUID.randomUUID();
        when(poRepository.findById(poId)).thenReturn(Optional.of(po));

        assertThrows(BusinessRuleException.class, () -> service.createReceipt(poId, null));
    }

    @Test
    void upsertItemBlocksExcessiveQuantity() {
        PurchaseOrder po = issuedPo();
        PurchaseReceipt receipt = draftReceipt(po);
        PurchaseOrderItem poItem = variantItem(po, 2);
        when(receiptItemRepository.findByPurchaseReceiptId(receiptIdHolder)).thenReturn(List.of());

        ReceiptItemRequest request = new ReceiptItemRequest(poItemIdHolder, 2, 1, null, null); // total=3 > qty=2

        assertThrows(BusinessRuleException.class, () -> service.upsertItem(receiptIdHolder, request));
    }

    @Test
    void upsertItemRejectsTotalOfZero() {
        PurchaseOrder po = issuedPo();
        draftReceipt(po);
        variantItem(po, 5);
        when(receiptItemRepository.findByPurchaseReceiptId(receiptIdHolder)).thenReturn(List.of());

        ReceiptItemRequest request = new ReceiptItemRequest(poItemIdHolder, 0, 0, null, null);
        assertThrows(BusinessRuleException.class, () -> service.upsertItem(receiptIdHolder, request));
    }

    @Test
    void finalizeCreatesOneStockUnitPerAcceptedVariantUnit() {
        PurchaseOrder po = issuedPo();
        PurchaseReceipt receipt = draftReceipt(po);
        PurchaseOrderItem poItem = variantItem(po, 3);

        PurchaseReceiptItem ri = new PurchaseReceiptItem();
        ri.setPurchaseReceipt(receipt);
        ri.setPurchaseOrderItem(poItem);
        ri.setAcceptedQuantity(2);
        ri.setRejectedQuantity(1);

        when(receiptItemRepository.findByPurchaseReceiptId(receiptIdHolder)).thenReturn(List.of(ri));
        when(stockUnitRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.finalizeReceipt(receiptIdHolder);

        verify(stockUnitRepository, times(2)).save(any(StockUnit.class));
        verify(stockMovementRepository, times(2)).save(any(StockMovement.class));
    }

    @Test
    void finalizeIncrementsComponentStockByAcceptedQuantity() {
        PurchaseOrder po = issuedPo();
        PurchaseReceipt receipt = draftReceipt(po);
        PurchaseOrderItem poItem = componentItem(po, 10);

        PurchaseReceiptItem ri = new PurchaseReceiptItem();
        ri.setPurchaseReceipt(receipt);
        ri.setPurchaseOrderItem(poItem);
        ri.setAcceptedQuantity(7);
        ri.setRejectedQuantity(3);

        when(receiptItemRepository.findByPurchaseReceiptId(receiptIdHolder)).thenReturn(List.of(ri));

        UUID compId = poItem.getProductComponent().getId();
        service.finalizeReceipt(receiptIdHolder);

        verify(componentStockService).adjustQuantity(
                any(), eq(compId),
                eq(7), eq(MovementType.COMPONENT_RECEIVING), any());
    }

    @Test
    void finalizeBlockedOnAlreadyFinalizedReceipt() {
        PurchaseReceipt receipt = new PurchaseReceipt();
        receipt.setPurchaseOrder(mock(PurchaseOrder.class));
        receipt.setStatus(PurchaseReceiptStatus.FINALIZED);
        UUID id = UUID.randomUUID();
        when(receiptRepository.findById(id)).thenReturn(Optional.of(receipt));

        assertThrows(BusinessRuleException.class, () -> service.finalizeReceipt(id));
    }
}
