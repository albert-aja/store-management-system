package com.sms.foundation.document;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/documents/print")
@RequiredArgsConstructor
public class PrintableDocumentController {

    private final PrintableDocumentService printableDocumentService;

    @GetMapping(value = "/surat-jalan/{deliveryOrderId}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> printSuratJalan(@PathVariable UUID deliveryOrderId) {
        return ResponseEntity.ok(printableDocumentService.generateSuratJalanHtml(deliveryOrderId));
    }

    @GetMapping(value = "/credit-agreement/{salesOrderId}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> printCreditAgreement(@PathVariable UUID salesOrderId) {
        return ResponseEntity.ok(printableDocumentService.generateCreditAgreementHtml(salesOrderId));
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
}

