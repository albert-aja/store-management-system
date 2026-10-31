package com.sms.inventory;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stores/{storeId}/component-stock")
@RequiredArgsConstructor
public class ComponentStockController {

    private final ComponentStockService componentStockService;

    @GetMapping
    public List<ComponentStockResponse> listByStore(@PathVariable UUID storeId) {
        return componentStockService.listByStore(storeId).stream().map(ComponentStockResponse::from).toList();
    }

    @PostMapping("/adjust")
    @PreAuthorize("hasAuthority('INVENTORY_MANAGE')")
    public ComponentStockResponse adjust(@PathVariable UUID storeId, @Valid @RequestBody AdjustComponentStockRequest request) {
        MovementType type = request.delta() > 0 ? MovementType.COMPONENT_RECEIVING : MovementType.COMPONENT_ADJUSTMENT;
        return ComponentStockResponse.from(componentStockService.adjustQuantity(
                storeId, request.productComponentId(), request.delta(), type, request.notes()));
    }
}
