package com.sms.foundation.document;

import com.sms.pricing.PriceListService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
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
    private final HeadlessPdfService headlessPdfService;

    // --- HTML Print Preview Endpoints ---

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

    @GetMapping(value = "/customer-statement/{customerId}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> printCustomerStatement(@PathVariable UUID customerId) {
        return ResponseEntity.ok(printableDocumentService.generateCustomerBillingStatementHtml(customerId));
    }

    @GetMapping(value = "/statement/{receivableId}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> printReceivableStatement(@PathVariable UUID receivableId) {
        return ResponseEntity.ok(printableDocumentService.generateReceivableStatementHtml(receivableId));
    }

    public record CustomerBatchStatementPayload(UUID storeId, List<UUID> customerIds, String status) {}

    @GetMapping(value = "/customer-statements/batch", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> printCustomerStatementsBatch(
            @RequestParam(required = false) UUID storeId,
            @RequestParam(required = false) List<UUID> customerIds,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(printableDocumentService.generateCustomerStatementsBatchHtml(storeId, customerIds, status));
    }

    @PostMapping(value = "/customer-statements/batch", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> printCustomerStatementsBatchPost(@RequestBody(required = false) CustomerBatchStatementPayload payload) {
        UUID storeId = payload != null ? payload.storeId() : null;
        List<UUID> customerIds = payload != null ? payload.customerIds() : null;
        String status = payload != null ? payload.status() : null;
        return ResponseEntity.ok(printableDocumentService.generateCustomerStatementsBatchHtml(storeId, customerIds, status));
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

    // --- Byte-Perfect Headless Chromium PDF Endpoints (G.21) ---

    @GetMapping(value = "/invoice/{salesOrderId}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> printInvoicePdf(@PathVariable UUID salesOrderId) {
        String html = printableDocumentService.generateSalesOrderInvoiceHtml(salesOrderId);
        byte[] pdf = headlessPdfService.renderHtmlToPdf(html, false);
        return pdfResponse(pdf, "invoice-" + salesOrderId + ".pdf");
    }

    @GetMapping(value = "/surat-jalan/{deliveryOrderId}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> printSuratJalanPdf(@PathVariable UUID deliveryOrderId) {
        String html = printableDocumentService.generateSuratJalanHtml(deliveryOrderId);
        byte[] pdf = headlessPdfService.renderHtmlToPdf(html, false);
        return pdfResponse(pdf, "surat-jalan-" + deliveryOrderId + ".pdf");
    }

    @GetMapping(value = "/credit-agreement/{salesOrderId}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> printCreditAgreementPdf(@PathVariable UUID salesOrderId) {
        String html = printableDocumentService.generateCreditAgreementHtml(salesOrderId);
        byte[] pdf = headlessPdfService.renderHtmlToPdf(html, false);
        return pdfResponse(pdf, "credit-agreement-" + salesOrderId + ".pdf");
    }

    @GetMapping(value = "/receipt/{paymentId}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> printReceiptPdf(@PathVariable UUID paymentId) {
        String html = printableDocumentService.generatePaymentReceiptHtml(paymentId);
        byte[] pdf = headlessPdfService.renderHtmlToPdf(html, false);
        return pdfResponse(pdf, "receipt-" + paymentId + ".pdf");
    }

    @GetMapping(value = "/payroll-slip/{slipId}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> printPayrollSlipPdf(@PathVariable UUID slipId) {
        String html = printableDocumentService.generatePayrollSlipHtml(slipId);
        byte[] pdf = headlessPdfService.renderHtmlToPdf(html, false);
        return pdfResponse(pdf, "slip-gaji-" + slipId + ".pdf");
    }

    @GetMapping(value = "/repossession-notice/{returnId}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> printRepossessionNoticePdf(@PathVariable UUID returnId) {
        String html = printableDocumentService.generateRepossessionNoticeHtml(returnId);
        byte[] pdf = headlessPdfService.renderHtmlToPdf(html, false);
        return pdfResponse(pdf, "repossession-notice-" + returnId + ".pdf");
    }

    @GetMapping(value = "/customer-statement/{customerId}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> printCustomerStatementPdf(@PathVariable UUID customerId) {
        String html = printableDocumentService.generateCustomerBillingStatementHtml(customerId);
        byte[] pdf = headlessPdfService.renderHtmlToPdf(html, false);
        return pdfResponse(pdf, "billing-statement-" + customerId + ".pdf");
    }

    @GetMapping(value = "/statement/{receivableId}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> printReceivableStatementPdf(@PathVariable UUID receivableId) {
        String html = printableDocumentService.generateReceivableStatementHtml(receivableId);
        byte[] pdf = headlessPdfService.renderHtmlToPdf(html, false);
        return pdfResponse(pdf, "receivable-statement-" + receivableId + ".pdf");
    }

    @GetMapping(value = "/price-list/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> printPriceListPdf(
            @RequestParam UUID storeId,
            @RequestParam(required = false, defaultValue = "category") String groupBy,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate validFrom) {
        String html = priceListService.generatePriceListHtml(storeId, groupBy, validFrom);
        byte[] pdf = headlessPdfService.renderHtmlToPdf(html, false);
        return pdfResponse(pdf, "price-list-" + storeId + ".pdf");
    }

    @PostMapping(value = "/customer-statements/batch/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> printCustomerStatementsBatchPdf(@RequestBody(required = false) CustomerBatchStatementPayload payload) {
        UUID storeId = payload != null ? payload.storeId() : null;
        List<UUID> customerIds = payload != null ? payload.customerIds() : null;
        String status = payload != null ? payload.status() : null;
        String html = printableDocumentService.generateCustomerStatementsBatchHtml(storeId, customerIds, status);
        byte[] pdf = headlessPdfService.renderHtmlToPdf(html, false);
        return pdfResponse(pdf, "batch-statements.pdf");
    }

    @PostMapping(value = "/bulk/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> printBulkPdf(@RequestBody BulkPrintPayload payload) {
        String html = printableDocumentService.generateBulkHtml(payload.documentType(), payload.ids());
        byte[] pdf = headlessPdfService.renderHtmlToPdf(html, false);
        return pdfResponse(pdf, "bulk-" + payload.documentType() + ".pdf");
    }

    public record RenderPdfRequest(String html, String filename, Boolean landscape) {}

    @PostMapping(value = "/render-pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> renderCustomHtmlToPdf(@RequestBody RenderPdfRequest request) {
        boolean landscape = request.landscape() != null && request.landscape();
        byte[] pdf = headlessPdfService.renderHtmlToPdf(request.html(), landscape);
        String filename = (request.filename() != null && !request.filename().isBlank())
                ? request.filename()
                : "document.pdf";
        if (!filename.endsWith(".pdf")) {
            filename += ".pdf";
        }
        return pdfResponse(pdf, filename);
    }

    private ResponseEntity<byte[]> pdfResponse(byte[] pdfBytes, String filename) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
