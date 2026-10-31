package com.sms.inventory;

import com.sms.common.web.BusinessRuleException;
import com.sms.common.web.NotFoundException;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import com.sms.product.dto.ProductComponent;
import com.sms.product.repository.ProductComponentRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ComponentStockService {

    private final ComponentStockRepository componentStockRepository;
    private final StockMovementRepository movementRepository;
    private final StoreRepository storeRepository;
    private final ProductComponentRepository productComponentRepository;

    @Transactional(readOnly = true)
    public List<ComponentStock> listByStore(UUID storeId) {
        return componentStockRepository.findByStoreId(storeId);
    }

    /** Positive delta = receiving loose spare parts; negative = consumption/adjustment. Never goes below zero. */
    public ComponentStock adjustQuantity(UUID storeId, UUID productComponentId, int delta, MovementType movementType, String notes) {
        ComponentStock stock = componentStockRepository.findByStoreIdAndProductComponentId(storeId, productComponentId)
                .orElseGet(() -> {
                    Store store = storeRepository.findById(storeId)
                            .orElseThrow(() -> new NotFoundException("Store not found: " + storeId));
                    ProductComponent component = productComponentRepository.findById(productComponentId)
                            .orElseThrow(() -> new NotFoundException("Product component not found: " + productComponentId));
                    ComponentStock created = new ComponentStock();
                    created.setStore(store);
                    created.setProductComponent(component);
                    created.setQuantityOnHand(0);
                    return componentStockRepository.save(created);
                });
        int newQuantity = stock.getQuantityOnHand() + delta;
        if (newQuantity < 0) {
            throw new BusinessRuleException("Component stock cannot go below zero (have " + stock.getQuantityOnHand() + ")");
        }
        stock.setQuantityOnHand(newQuantity);

        StockMovement movement = new StockMovement();
        movement.setMovementType(movementType);
        movement.setComponentStock(stock);
        movement.setQuantity(Math.abs(delta));
        movement.setNotes(notes);
        movementRepository.save(movement);
        return stock;
    }

    @Transactional(readOnly = true)
    public List<StockMovement> history(UUID componentStockId) {
        return movementRepository.findByComponentStockIdOrderByOccurredAtDesc(componentStockId);
    }
}
