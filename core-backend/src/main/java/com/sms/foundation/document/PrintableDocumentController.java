package com.sms.foundation.document;

import com.sms.pricing.PriceListService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/documents/print")
@RequiredArgsConstructor
public class PrintableDocumentController {

    private final PrintableDocumentService printableDocumentService;
    private final PriceListService priceListService;

    @GetMapping(value = "/surat-jalan/{deliveryOrderId}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> printSuratJalan(@PathVariable UUID deliveryOrderId) {
        return ResponseEntity.ok(printableDocumentService.generateSuratJalanHtml(deliveryOrderId));
    }

    @GetMapping(value = "/credit-agreement/{salesOrderId}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> printCreditAgreement(@PathVariable UUID salesOrderId) {
        return ResponseEntity.ok(printableDocumentService.generateCreditAgreementHtml(salesOrderId));
    }

    @GetMapping(value = "/invoice/{salesOrderId}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> printInvoice(@PathVariable UUID salesOrderId) {
        return ResponseEntity.ok(printableDocumentService.generateSalesOrderInvoiceHtml(salesOrderId));
    }

    @GetMapping(value = "/receipt/{paymentId}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> printReceipt(@PathVariable UUID paymentId) {
        return ResponseEntity.ok(printableDocumentService.generatePaymentReceiptHtml(paymentId));
    }

    @GetMapping(value = "/payroll-slip/{slipId}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> printPayrollSlip(@PathVariable UUID slipId) {
        return ResponseEntity.ok(printableDocumentService.generatePayrollSlipHtml(slipId));
    }

    @GetMapping(value = "/repossession-notice/{returnId}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> printRepossessionNotice(@PathVariable UUID returnId) {
        return ResponseEntity.ok(printableDocumentService.generateRepossessionNoticeHtml(returnId));
    }

    @GetMapping(value = "/price-list", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> printPriceList(
            @RequestParam UUID storeId,
            @RequestParam(required = false, defaultValue = "category") String groupBy,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate validFrom) {
        return ResponseEntity.ok(priceListService.generatePriceListHtml(storeId, groupBy, validFrom));
    }

    public record BulkPrintPayload(String documentType, List<UUID> ids) {}

    @GetMapping(value = "/bulk", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> printBulkGet(
            @RequestParam String type,
            @RequestParam List<UUID> ids) {
        return ResponseEntity.ok(printableDocumentService.generateBulkHtml(type, ids));
    }

    @PostMapping(value = "/bulk", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> printBulkPost(@RequestBody BulkPrintPayload payload) {
        return ResponseEntity.ok(printableDocumentService.generateBulkHtml(payload.documentType(), payload.ids()));
    }
}
