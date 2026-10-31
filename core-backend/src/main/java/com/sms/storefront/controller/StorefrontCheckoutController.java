package com.sms.storefront.controller;

import com.sms.foundation.store.Store;
import com.sms.storefront.dto.CheckoutRequest;
import com.sms.storefront.dto.CheckoutResponse;
import com.sms.storefront.model.StorefrontPaymentMethod;
import com.sms.storefront.service.StorefrontCheckoutService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/storefront/checkout")
@RequiredArgsConstructor
public class StorefrontCheckoutController {

    private final StorefrontCheckoutService checkoutService;

    @GetMapping("/payment-methods")
    public List<StorefrontPaymentMethod> getPaymentMethods() {
        return checkoutService.getAvailablePaymentMethods();
    }

    @GetMapping("/pickup-branches")
    public List<Store> getPickupBranches() {
        return checkoutService.getPickupBranches();
    }

    @PostMapping
    public CheckoutResponse processCheckout(@Valid @RequestBody CheckoutRequest request) {
        return checkoutService.processCheckout(request);
    }
}

