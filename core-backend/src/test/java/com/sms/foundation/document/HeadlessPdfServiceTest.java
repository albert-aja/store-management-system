package com.sms.foundation.document;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class HeadlessPdfServiceTest {

    private HeadlessPdfService pdfService;

    @BeforeEach
    void setUp() {
        pdfService = new HeadlessPdfService();
    }

    @Test
    void renderHtmlToPdf_rejectsNullOrBlankHtml() {
        assertThrows(IllegalArgumentException.class, () -> pdfService.renderHtmlToPdf(null));
        assertThrows(IllegalArgumentException.class, () -> pdfService.renderHtmlToPdf("   "));
    }

    @Test
    void renderHtmlToPdf_rendersValidA4PdfFromSimpleHtml() {
        String html = "<!DOCTYPE html><html><head><title>Test Invoice</title></head>" +
                "<body><h1>FAKTUR PENJUALAN</h1><p>Pelanggan: Budi Santoso</p>" +
                "<table><tr><th>Barang</th><th>Harga</th></tr>" +
                "<tr><td>Smart TV 55 Inch</td><td>Rp 7.500.000</td></tr></table></body></html>";

        byte[] pdfBytes = pdfService.renderHtmlToPdf(html, false);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 500, "PDF size should be substantial (> 500 bytes)");

        // Validate PDF header
        String magicHeader = new String(pdfBytes, 0, 5, StandardCharsets.US_ASCII);
        assertTrue(magicHeader.startsWith("%PDF-"), "Generated file must start with '%PDF-' header");
    }

    @Test
    void renderHtmlToPdf_rendersLandscapeOrientation() {
        String html = "<!DOCTYPE html><html><head><title>Price List Landscape</title></head>" +
                "<body><h1>DAFTAR HARGA TOKO</h1><p>Berlaku mulai: 2026-11-01</p></body></html>";

        byte[] pdfBytes = pdfService.renderHtmlToPdf(html, true);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 500);
        String magicHeader = new String(pdfBytes, 0, 5, StandardCharsets.US_ASCII);
        assertTrue(magicHeader.startsWith("%PDF-"));
    }
}

