package com.sms.inventory;

import com.sms.common.security.SmsUserPrincipal;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stocktakes")
@RequiredArgsConstructor
public class StocktakeController {

    private final StocktakeService stocktakeService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyAuthority('STOCKTAKE_COUNT', 'INVENTORY_MANAGE')")
    public StocktakeSessionResponse open(
            @Valid @RequestBody CreateStocktakeSessionRequest request,
            @AuthenticationPrincipal SmsUserPrincipal principal) {
        requireStoreAccess(principal, request.storeId());
        return stocktakeService.open(request.storeId(), principal.employeeId());
    }

    @GetMapping
    @PreAuthorize("hasAuthority('INVENTORY_MANAGE')")
    public List<StocktakeSessionResponse> list(
            @RequestParam UUID storeId,
            @AuthenticationPrincipal SmsUserPrincipal principal) {
        requireStoreAccess(principal, storeId);
        return stocktakeService.list(storeId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('INVENTORY_MANAGE')")
    public StocktakeSessionResponse get(
            @PathVariable UUID id,
            @AuthenticationPrincipal SmsUserPrincipal principal) {
        StocktakeSessionResponse session = stocktakeService.get(id);
        requireStoreAccess(principal, session.storeId());
        return session;
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAnyAuthority('STOCKTAKE_COUNT', 'INVENTORY_MANAGE')")
    public StocktakeSessionResponse submit(
            @PathVariable UUID id,
            @Valid @RequestBody SubmitStocktakeRequest request,
            @AuthenticationPrincipal SmsUserPrincipal principal) {
        requireStoreAccess(principal, stocktakeService.get(id).storeId());
        return stocktakeService.submit(id, request.countedSerials());
    }

    @PostMapping("/{id}/review")
    @PreAuthorize("hasAuthority('INVENTORY_MANAGE')")
    public StocktakeSessionResponse review(
            @PathVariable UUID id,
            @Valid @RequestBody ReviewStocktakeRequest request,
            @AuthenticationPrincipal SmsUserPrincipal principal) {
        requireStoreAccess(principal, stocktakeService.get(id).storeId());
        return stocktakeService.review(
                id, principal.employeeId(), request.approve(), request.comment());
    }

    private void requireStoreAccess(SmsUserPrincipal principal, UUID storeId) {
        if (!principal.hasStore(storeId)
                && !principal.hasRole("OWNER")
                && !principal.hasRole("ADMIN")) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "No access to store: " + storeId);
        }
    }
}
