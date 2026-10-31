package com.sms.inventory;

import com.sms.common.dto.BulkOperationResult;
import com.sms.common.web.BusinessRuleException;
import com.sms.common.web.ConflictException;
import com.sms.common.web.NotFoundException;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import com.sms.product.dto.ProductVariant;
import com.sms.product.repository.ProductVariantRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class StockUnitService {

    private final StockUnitRepository stockUnitRepository;
    private final StockMovementRepository movementRepository;
    private final StoreRepository storeRepository;
    private final ProductVariantRepository variantRepository;

    @Transactional(readOnly = true)
    public List<StockUnit> search(UUID storeId, UUID variantId, StockAvailability availability) {
        return stockUnitRepository.search(storeId, variantId, availability);
    }

    @Transactional(readOnly = true)
    public StockUnit getStockUnit(UUID id) {
        return stockUnitRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Stock Unit not found: " + id));
    }

    public StockUnit receive(UUID productVariantId, UUID storeId, String manufacturerSerial, String notes) {
        ProductVariant variant = variantRepository.findById(productVariantId)
                .orElseThrow(() -> new NotFoundException("Product Variant not found: " + productVariantId));
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new NotFoundException("Store not found: " + storeId));

        if (manufacturerSerial != null && !manufacturerSerial.isBlank()) {
            if (stockUnitRepository.existsByManufacturerSerial(manufacturerSerial.trim())) {
                throw new ConflictException("Manufacturer serial already exists: " + manufacturerSerial);
            }
        }

        StockUnit unit = new StockUnit();
        unit.setProductVariant(variant);
        unit.setCurrentStore(store);
        unit.setManufacturerSerial(manufacturerSerial != null && !manufacturerSerial.isBlank() ? manufacturerSerial.trim() : null);
        unit.setLocationType(StockLocationType.WAREHOUSE);
        unit.setAvailabilityStatus(StockAvailability.AVAILABLE);
        unit.setNotes(notes);
        unit = stockUnitRepository.save(unit);

        postMovement(MovementType.RECEIVING, unit, null, null, store, StockLocationType.WAREHOUSE,
                "MANUAL_RECEIVE", unit.getId(), notes);
        return unit;
    }

    public StockUnit transfer(UUID stockUnitId, UUID toStoreId, StockLocationType toLocationType, String notes) {
        StockUnit unit = getStockUnit(stockUnitId);
        if (unit.getAvailabilityStatus() == StockAvailability.RESERVED) {
            throw new BusinessRuleException("Cannot transfer a RESERVED stock unit");
        }
        Store toStore = storeRepository.findById(toStoreId)
                .orElseThrow(() -> new NotFoundException("Target Store not found: " + toStoreId));

        Store fromStore = unit.getCurrentStore();
        StockLocationType fromLocationType = unit.getLocationType();

        unit.setCurrentStore(toStore);
        unit.setLocationType(toLocationType);

        postMovement(MovementType.TRANSFER, unit, fromStore, fromLocationType, toStore, toLocationType,
                "MANUAL_TRANSFER", unit.getId(), notes);
        return unit;
    }

    /** Manual availability override (e.g. mark damaged/Unavailable) outside the normal reservation flow. */
    public StockUnit adjustAvailability(UUID stockUnitId, StockAvailability newStatus, String reason) {
        StockUnit unit = getStockUnit(stockUnitId);
        unit.setAvailabilityStatus(newStatus);
        postMovement(MovementType.ADJUSTMENT, unit, unit.getCurrentStore(), unit.getLocationType(),
                unit.getCurrentStore(), unit.getLocationType(), "MANUAL_ADJUSTMENT", unit.getId(), reason);
        return unit;
    }

    public BulkOperationResult bulkAdjustAvailability(List<UUID> ids, StockAvailability availability, String reason) {
        List<BulkOperationResult.BulkItemResult> results = new ArrayList<>();
        for (UUID id : ids) {
            try {
                adjustAvailability(id, availability, reason != null ? reason : "Bulk availability update");
                results.add(new BulkOperationResult.BulkItemResult(id, true, "Availability set to " + availability));
            } catch (Exception e) {
                results.add(new BulkOperationResult.BulkItemResult(id, false, e.getMessage()));
            }
        }
        return BulkOperationResult.of(results);
    }

    @Transactional(readOnly = true)
    public List<StockMovement> history(UUID stockUnitId) {
        return movementRepository.findByStockUnitIdOrderByOccurredAtDesc(stockUnitId);
    }

    private void postMovement(MovementType type, StockUnit unit, Store fromStore, StockLocationType fromLocationType,
                               Store toStore, StockLocationType toLocationType,
                               String referenceType, UUID referenceId, String notes) {
        StockMovement movement = new StockMovement();
        movement.setMovementType(type);
        movement.setStockUnit(unit);
        movement.setQuantity(1);
        movement.setFromStore(fromStore);
        movement.setToStore(toStore);
        movement.setFromLocationType(fromLocationType);
        movement.setToLocationType(toLocationType);
        movement.setReferenceType(referenceType);
        movement.setReferenceId(referenceId);
        movement.setNotes(notes);
        movementRepository.save(movement);
    }
}
