package com.sms.foundation.store;

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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;

    @GetMapping
    public List<StoreResponse> listStores() {
        return storeService.listStores().stream().map(StoreResponse::from).toList();
    }

    @GetMapping("/{id}")
    public StoreResponse getStore(@PathVariable UUID id) {
        return StoreResponse.from(storeService.getStore(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('STORE_MANAGE')")
    public StoreResponse createStore(@Valid @RequestBody StoreRequest request) {
        return StoreResponse.from(storeService.createStore(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('STORE_MANAGE')")
    public StoreResponse updateStore(@PathVariable UUID id, @Valid @RequestBody StoreRequest request) {
        return StoreResponse.from(storeService.updateStore(id, request));
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('STORE_MANAGE')")
    public void deactivate(@PathVariable UUID id) {
        storeService.setActive(id, false);
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('STORE_MANAGE')")
    public void activate(@PathVariable UUID id) {
        storeService.setActive(id, true);
    }
}
