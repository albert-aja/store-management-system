package com.sms.inventory;

import com.sms.common.web.BusinessRuleException;
import com.sms.common.web.ConflictException;
import com.sms.common.web.NotFoundException;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import com.sms.product.dto.ProductVariant;
import com.sms.product.repository.ProductVariantRepository;
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

    /**
     * Ad-hoc/manual receiving until the Procurement module wires real PO-driven receiving — both post through
     * the same movement ledger so no historical rewrite is needed once Procurement exists.
     */
    public StockUnit receive(UUID variantId, UUID storeId, String manufacturerSerial, String notes) {
        if (manufacturerSerial != null && !manufacturerSerial.isBlank()
                && stockUnitRepository.existsByManufacturerSerial(manufacturerSerial)) {
            throw new ConflictException("Manufacturer serial already exists: " + manufacturerSerial);
        }
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new NotFoundException("Variant not found: " + variantId));
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new NotFoundException("Store not found: " + storeId));

        StockUnit unit = new StockUnit();
        unit.setProductVariant(variant);
        unit.setManufacturerSerial(manufacturerSerial);
        unit.setCurrentStore(store);
        unit.setLocationType(StockLocationType.WAREHOUSE);
        unit.setAvailabilityStatus(StockAvailability.AVAILABLE);
        unit.setNotes(notes);
        unit = stockUnitRepository.save(unit);

        postMovement(MovementType.RECEIVING, unit, null, null, store, StockLocationType.WAREHOUSE,
                "MANUAL_RECEIVING", unit.getId(), notes);
        return unit;
    }

    /** Cross-store transfer is blocked while Reserved (README 3.7); location-only moves within the same store are fine. */
    public StockUnit transfer(UUID stockUnitId, UUID toStoreId, StockLocationType toLocationType, String notes) {
        StockUnit unit = getStockUnit(stockUnitId);
        Store toStore = storeRepository.findById(toStoreId)
                .orElseThrow(() -> new NotFoundException("Store not found: " + toStoreId));
        boolean crossStore = !unit.getCurrentStore().getId().equals(toStoreId);
        if (crossStore && unit.getAvailabilityStatus() == StockAvailability.RESERVED) {
            throw new BusinessRuleException("Reserved Stock Unit cannot be transferred to another store");
        }
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
