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
@RequestMapping("/api/sales-order-items/{itemId}/allocations")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('INVENTORY_MANAGE')")
public class AllocationController {

    private final AllocationService allocationService;

    @GetMapping
    public List<AllocationResponse> list(@PathVariable UUID itemId) {
        return allocationService.listForItem(itemId).stream().map(AllocationResponse::from).toList();
    }

    @PostMapping
    public AllocationResponse allocate(@PathVariable UUID itemId, @Valid @RequestBody AllocateRequest request) {
        return AllocationResponse.from(allocationService.allocate(itemId, request.stockUnitId()));
    }

    @PostMapping("/{allocationId}/release")
    public void release(@PathVariable UUID itemId, @PathVariable UUID allocationId) {
        allocationService.releaseAllocation(allocationId);
    }
}
