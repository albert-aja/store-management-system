package com.sms.pricing;

import com.sms.common.security.SmsUserPrincipal;
import com.sms.pricing.dto.AutoApplyPricingRequest;
import com.sms.pricing.dto.GeneratePriceListVersionRequest;
import com.sms.pricing.dto.PriceCalculationRequest;
import com.sms.pricing.dto.PriceCalculationResponse;
import com.sms.pricing.dto.PriceListReportResponse;
import com.sms.pricing.dto.PriceListVersionDto;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stores/{storeId}/pricing")
@RequiredArgsConstructor
public class PricingController {

    private final PricingService pricingService;
    private final PriceCalculationService calculationService;
    private final PriceListService priceListService;
    private final PriceListVersionService priceListVersionService;

    @GetMapping
    public List<PriceResponse> listByStore(@PathVariable UUID storeId) {
        return pricingService.listByStore(storeId).stream().map(PriceResponse::from).toList();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PRICING_MANAGE')")
    public PriceResponse upsertPrice(@PathVariable UUID storeId, @Valid @RequestBody PriceRequest request) {
        return PriceResponse.from(pricingService.upsertPrice(
                storeId,
                request.productVariantId(),
                request.cashPrice(),
                request.basePrice(),
                request.downPayment()
        ));
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

    /**
     * Preview calculation of monthly installments using verified retail formula without saving.
     */
    @PostMapping("/calculate")
    public PriceCalculationResponse calculatePreview(@PathVariable UUID storeId, @RequestBody PriceCalculationRequest request) {
        return calculationService.calculate(request);
    }

    /**
     * Auto-calculates installments and saves StoreProductPrice + payment plans (10, 12, 15 months).
     */
    @PostMapping("/auto-apply")
    @PreAuthorize("hasAuthority('PRICING_MANAGE')")
    public PriceResponse autoApply(@PathVariable UUID storeId, @RequestBody AutoApplyPricingRequest request) {
        AutoApplyPricingRequest scopedReq = new AutoApplyPricingRequest(
                storeId,
                request.variantId(),
                request.hargaDasar(),
                request.downPayment(),
                request.cashPrice(),
                request.termMonths()
        );
        StoreProductPrice saved = calculationService.autoApplyPricing(scopedReq);
        return PriceResponse.from(saved);
    }

    /**
     * Batch auto-calculates payment plans for all priced variants in this store.
     */
    @PostMapping("/auto-apply-all")
    @PreAuthorize("hasAuthority('PRICING_MANAGE')")
    public int autoApplyAll(@PathVariable UUID storeId) {
        return calculationService.autoApplyAllForStore(storeId);
    }

    /**
     * Structured price list report endpoint grouped by category or brand.
     */
    @GetMapping("/price-list")
    public PriceListReportResponse getPriceList(
            @PathVariable UUID storeId,
            @RequestParam(required = false, defaultValue = "category") String groupBy,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate validFrom) {
        return priceListService.getPriceListReport(storeId, groupBy, validFrom);
    }

    /**
     * Live ready-to-print HTML preview for current price list.
     */
    @GetMapping(value = "/price-list/html", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getPriceListHtml(
            @PathVariable UUID storeId,
            @RequestParam(required = false, defaultValue = "category") String groupBy,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate validFrom) {
        return ResponseEntity.ok(priceListService.generatePriceListHtml(storeId, groupBy, validFrom));
    }

    /**
     * Generates a frozen price list document snapshot and stores it persistently in the database.
     */
    @PostMapping("/price-list/generate-and-store")
    @PreAuthorize("hasAuthority('PRICING_MANAGE')")
    public PriceListVersionDto generateAndStorePriceList(
            @PathVariable UUID storeId,
            @RequestBody(required = false) GeneratePriceListVersionRequest request,
            @AuthenticationPrincipal SmsUserPrincipal principal) {
        GeneratePriceListVersionRequest req = request != null ? request : new GeneratePriceListVersionRequest("category", LocalDate.now(), null);
        UUID createdBy = principal != null ? principal.employeeId() : null;
        return priceListVersionService.generateAndStoreVersion(storeId, req, createdBy);
    }

    /**
     * Lists all stored price list versions for the store.
     */
    @GetMapping("/price-list/versions")
    public List<PriceListVersionDto> listPriceListVersions(@PathVariable UUID storeId) {
        return priceListVersionService.listVersions(storeId);
    }

    /**
     * Retrieves the latest stored price list version metadata for fast download without regeneration.
     */
    @GetMapping("/price-list/latest")
    public ResponseEntity<PriceListVersionDto> getLatestPriceListVersion(
            @PathVariable UUID storeId,
            @RequestParam(required = false) String groupBy) {
        return priceListVersionService.getLatestStoredVersion(storeId, groupBy)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /**
     * View/render stored HTML document version.
     */
    @GetMapping(value = "/price-list/versions/{versionId}/view", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> viewPriceListVersion(
            @PathVariable UUID storeId,
            @PathVariable UUID versionId) {
        PriceListVersion entity = priceListVersionService.getVersionEntity(versionId);
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(entity.getContentHtml());
    }

    /**
     * Download stored HTML document version with attachment header.
     */
    @GetMapping("/price-list/versions/{versionId}/download")
    public ResponseEntity<byte[]> downloadPriceListVersion(
            @PathVariable UUID storeId,
            @PathVariable UUID versionId) {
        PriceListVersion entity = priceListVersionService.getVersionEntity(versionId);
        byte[] bytes = entity.getContentHtml().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(entity.getMimeType() != null ? entity.getMimeType() : "text/html"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + entity.getFileName() + "\"")
                .body(bytes);
    }

    /**
     * Delete a stored price list version.
     */
    @DeleteMapping("/price-list/versions/{versionId}")
    @PreAuthorize("hasAuthority('PRICING_MANAGE')")
    public void deletePriceListVersion(
            @PathVariable UUID storeId,
            @PathVariable UUID versionId) {
        priceListVersionService.deleteVersion(versionId);
    }
}
