package com.sms.pricing;

import com.sms.pricing.dto.DiscountCalculationRequest;
import com.sms.pricing.dto.DiscountCalculationResult;
import com.sms.pricing.dto.PriceDiscountRequest;
import com.sms.pricing.dto.PriceDiscountResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pricing/discounts")
@RequiredArgsConstructor
public class PriceDiscountController {

    private final PriceDiscountService discountService;

    @GetMapping
    public List<PriceDiscountResponse> listDiscounts(
            @RequestParam(required = false) UUID storeId,
            @RequestParam(required = false) Boolean activeOnly) {
        return discountService.listDiscounts(storeId, activeOnly);
    }

    @GetMapping("/{id}")
    public PriceDiscountResponse getDiscount(@PathVariable UUID id) {
        return discountService.getDiscountResponse(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PRICING_MANAGE')")
    public PriceDiscountResponse createDiscount(@Valid @RequestBody PriceDiscountRequest req) {
        return discountService.createDiscount(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PRICING_MANAGE')")
    public PriceDiscountResponse updateDiscount(
            @PathVariable UUID id,
            @Valid @RequestBody PriceDiscountRequest req) {
        return discountService.updateDiscount(id, req);
    }

    @PostMapping("/{id}/toggle-active")
    @PreAuthorize("hasAuthority('PRICING_MANAGE')")
    public PriceDiscountResponse toggleActive(@PathVariable UUID id) {
        return discountService.toggleActive(id);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PRICING_MANAGE')")
    public void deleteDiscount(@PathVariable UUID id) {
        discountService.deleteDiscount(id);
    }

    @PostMapping("/calculate")
    public DiscountCalculationResult calculateDiscount(@Valid @RequestBody DiscountCalculationRequest req) {
        int qty = req.quantity() != null ? req.quantity() : 1;
        return discountService.calculateDiscount(
                req.storeId(),
                req.productVariantId(),
                req.productId(),
                req.basePrice(),
                qty);
    }
}

