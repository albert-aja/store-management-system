package com.sms.pricing;

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
@RequestMapping("/api/stores/{storeId}/pricing")
@RequiredArgsConstructor
public class PricingController {

    private final PricingService pricingService;

    @GetMapping
    public List<PriceResponse> listByStore(@PathVariable UUID storeId) {
        return pricingService.listByStore(storeId).stream().map(PriceResponse::from).toList();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PRICING_MANAGE')")
    public PriceResponse upsertPrice(@PathVariable UUID storeId, @Valid @RequestBody PriceRequest request) {
        return PriceResponse.from(pricingService.upsertPrice(storeId, request.productVariantId(), request.cashPrice()));
    }

    @PostMapping("/{priceId}/deactivate")
    @PreAuthorize("hasAuthority('PRICING_MANAGE')")
    public void deactivatePrice(@PathVariable UUID storeId, @PathVariable UUID priceId) {
        pricingService.setPriceActive(priceId, false);
    }

    @GetMapping("/{priceId}/plans")
    public List<PaymentPlanResponse> listPlans(@PathVariable UUID storeId, @PathVariable UUID priceId) {
        return pricingService.listPaymentPlans(priceId).stream().map(PaymentPlanResponse::from).toList();
    }

    @PostMapping("/{priceId}/plans")
    @PreAuthorize("hasAuthority('PRICING_MANAGE')")
    public PaymentPlanResponse upsertPlan(@PathVariable UUID storeId, @PathVariable UUID priceId,
                                           @Valid @RequestBody PaymentPlanRequest request) {
        return PaymentPlanResponse.from(pricingService.upsertPaymentPlan(priceId, request.termMonths(), request.totalPrice()));
    }

    @PostMapping("/plans/{planId}/deactivate")
    @PreAuthorize("hasAuthority('PRICING_MANAGE')")
    public void deactivatePlan(@PathVariable UUID storeId, @PathVariable UUID planId) {
        pricingService.setPaymentPlanActive(planId, false);
    }
}
