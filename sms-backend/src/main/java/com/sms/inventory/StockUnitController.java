package com.sms.inventory;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stock-units")
@RequiredArgsConstructor
public class StockUnitController {

    private final StockUnitService stockUnitService;

    @GetMapping
    public List<StockUnitResponse> search(@RequestParam(required = false) UUID storeId,
                                           @RequestParam(required = false) UUID variantId,
                                           @RequestParam(required = false) StockAvailability availability) {
        return stockUnitService.search(storeId, variantId, availability).stream().map(StockUnitResponse::from).toList();
    }

    @GetMapping("/{id}")
    public StockUnitResponse getStockUnit(@PathVariable UUID id) {
        return StockUnitResponse.from(stockUnitService.getStockUnit(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('INVENTORY_MANAGE')")
    public StockUnitResponse receive(@Valid @RequestBody ReceiveStockUnitRequest request) {
        return StockUnitResponse.from(stockUnitService.receive(
                request.productVariantId(), request.storeId(), request.manufacturerSerial(), request.notes()));
    }

    @PostMapping("/{id}/transfer")
    @PreAuthorize("hasAuthority('INVENTORY_MANAGE')")
    public StockUnitResponse transfer(@PathVariable UUID id, @Valid @RequestBody TransferStockUnitRequest request) {
        return StockUnitResponse.from(stockUnitService.transfer(id, request.toStoreId(), request.toLocationType(), request.notes()));
    }

    @PutMapping("/{id}/availability")
    @PreAuthorize("hasAuthority('INVENTORY_MANAGE')")
    public StockUnitResponse adjustAvailability(@PathVariable UUID id, @Valid @RequestBody AdjustAvailabilityRequest request) {
        return StockUnitResponse.from(stockUnitService.adjustAvailability(id, request.status(), request.reason()));
    }

    @GetMapping("/{id}/movements")
    public List<StockMovementResponse> history(@PathVariable UUID id) {
        return stockUnitService.history(id).stream().map(StockMovementResponse::from).toList();
    }
}
