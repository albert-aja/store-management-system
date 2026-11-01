package com.sms.foundation.document;

import com.sms.common.web.NotFoundException;
import com.sms.customer.Customer;
import com.sms.customer.CustomerAddress;
import com.sms.customer.CustomerRepository;
import com.sms.delivery.DeliveryItem;
import com.sms.delivery.DeliveryOrder;
import com.sms.delivery.DeliveryOrderRepository;
import com.sms.finance.CustomerPayment;
import com.sms.finance.CustomerPaymentRepository;
import com.sms.finance.InstallmentStatus;
import com.sms.finance.PaymentAllocation;
import com.sms.finance.Receivable;
import com.sms.finance.ReceivableInstallment;
import com.sms.finance.ReceivableRepository;
import com.sms.finance.ReceivableStatus;
import com.sms.payroll.PayrollSlip;
import com.sms.payroll.PayrollSlipRepository;
import com.sms.repossession.StockReturn;
import com.sms.repossession.StockReturnRepository;
import com.sms.sales.SalesOrder;
import com.sms.sales.SalesOrderItem;
import com.sms.sales.SalesOrderItemRepository;
import com.sms.sales.SalesOrderRepository;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PrintableDocumentService {

    private final DeliveryOrderRepository deliveryOrderRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final SalesOrderItemRepository salesOrderItemRepository;
    private final CustomerPaymentRepository customerPaymentRepository;
    private final PayrollSlipRepository payrollSlipRepository;
    private final StockReturnRepository stockReturnRepository;
    private final ReceivableRepository receivableRepository;
    private final CustomerRepository customerRepository;

    private static final Locale ID_LOCALE = Locale.of("id", "ID");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMMM yyyy", ID_LOCALE);

    private String formatRp(BigDecimal amount) {
        if (amount == null) amount = BigDecimal.ZERO;
        NumberFormat nf = NumberFormat.getCurrencyInstance(ID_LOCALE);
        return nf.format(amount).replace(",00", "");
    }

    private String baseHtml(String title, String content) {
        return "<!DOCTYPE html>\n" +
                "<html lang=\"id\">\n" +
                "<head>\n" +
                "  <meta charset=\"UTF-8\" />\n" +
                "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n" +
                "  <title>" + title + "</title>\n" +
                "  <style>\n" +
                "    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px auto; max-width: 800px; color: #1e293b; line-height: 1.5; font-size: 13px; }\n" +
                "    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }\n" +
                "    .store-name { font-size: 20px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }\n" +
                "    .store-info { font-size: 11px; color: #64748b; }\n" +
                "    .doc-title { text-align: right; }\n" +
                "    .doc-name { font-size: 18px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; }\n" +
                "    .doc-number { font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px; }\n" +
                "    .section { margin-bottom: 18px; }\n" +
                "    .section-title { font-size: 13px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; }\n" +
                "    table.data-table { width: 100%; border-collapse: collapse; margin-top: 8px; }\n" +
                "    table.data-table th, table.data-table td { border: 1px solid #cbd5e1; padding: 7px 10px; font-size: 12px; }\n" +
                "    table.data-table th { background-color: #f1f5f9; text-align: left; font-weight: 700; color: #334155; }\n" +
                "    .text-right { text-align: right; }\n" +
                "    .text-center { text-align: center; }\n" +
                "    .badge { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; }\n" +
                "    .badge-success { background: #dcfce7; color: #166534; border: 1px solid #86efac; }\n" +
                "    .badge-warning { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }\n" +
                "    .badge-danger { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }\n" +
                "    .badge-info { background: #e0f2fe; color: #075985; border: 1px solid #7dd3fc; }\n" +
                "    .badge-neutral { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }\n" +
                "    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }\n" +
                "    .metric-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; text-align: center; }\n" +
                "    .metric-label { font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }\n" +
                "    .metric-value { font-size: 14px; font-weight: 800; color: #0f172a; }\n" +
                "    .notice-box { background: #f8fafc; border: 1px dashed #94a3b8; border-radius: 6px; padding: 10px 14px; font-size: 11px; color: #475569; margin-top: 15px; }\n" +
                "    .signatures { display: flex; justify-content: space-between; margin-top: 40px; page-break-inside: avoid; }\n" +
                "    .sig-box { width: 30%; text-align: center; font-size: 11px; }\n" +
                "    .sig-line { margin-top: 60px; border-bottom: 1px solid #334155; font-weight: 700; padding-bottom: 2px; }\n" +
                "    .print-bar { background: #1e3a8a; color: #fff; padding: 10px 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }\n" +
                "    .print-btn { background: #10b981; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; cursor: pointer; }\n" +
                "    .print-btn:hover { background: #059669; }\n" +
                "    @media print {\n" +
                "      .no-print { display: none !important; }\n" +
                "      body { margin: 0; padding: 10mm; font-size: 11pt; }\n" +
                "    }\n" +
                "  </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "  <div class=\"print-bar no-print\">\n" +
                "    <span><strong>Document Print Preview:</strong> " + title + "</span>\n" +
                "    <button class=\"print-btn\" onclick=\"window.print()\">Print Document / PDF</button>\n" +
                "  </div>\n" +
                content +
                "</body>\n" +
                "</html>";
    }

    private String baseBulkHtml(String title, String content, int count) {
        return "<!DOCTYPE html>\n" +
                "<html lang=\"id\">\n" +
                "<head>\n" +
                "  <meta charset=\"UTF-8\" />\n" +
                "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n" +
                "  <title>" + title + " (" + count + " Dokumen)</title>\n" +
                "  <style>\n" +
                "    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px auto; max-width: 800px; color: #1e293b; line-height: 1.5; font-size: 13px; }\n" +
                "    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }\n" +
                "    .store-name { font-size: 20px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }\n" +
                "    .store-info { font-size: 11px; color: #64748b; }\n" +
                "    .doc-title { text-align: right; }\n" +
                "    .doc-name { font-size: 18px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; }\n" +
                "    .doc-number { font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px; }\n" +
                "    .section { margin-bottom: 18px; }\n" +
                "    .section-title { font-size: 13px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; }\n" +
                "    table.data-table { width: 100%; border-collapse: collapse; margin-top: 8px; }\n" +
                "    table.data-table th, table.data-table td { border: 1px solid #cbd5e1; padding: 7px 10px; font-size: 12px; }\n" +
                "    table.data-table th { background-color: #f1f5f9; text-align: left; font-weight: 700; color: #334155; }\n" +
                "    .text-right { text-align: right; }\n" +
                "    .text-center { text-align: center; }\n" +
                "    .badge { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; }\n" +
                "    .badge-success { background: #dcfce7; color: #166534; border: 1px solid #86efac; }\n" +
                "    .badge-warning { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }\n" +
                "    .badge-danger { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }\n" +
                "    .badge-info { background: #e0f2fe; color: #075985; border: 1px solid #7dd3fc; }\n" +
                "    .badge-neutral { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }\n" +
                "    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }\n" +
                "    .metric-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; text-align: center; }\n" +
                "    .metric-label { font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }\n" +
                "    .metric-value { font-size: 14px; font-weight: 800; color: #0f172a; }\n" +
                "    .notice-box { background: #f8fafc; border: 1px dashed #94a3b8; border-radius: 6px; padding: 10px 14px; font-size: 11px; color: #475569; margin-top: 15px; }\n" +
                "    .signatures { display: flex; justify-content: space-between; margin-top: 40px; page-break-inside: avoid; }\n" +
                "    .sig-box { width: 30%; text-align: center; font-size: 11px; }\n" +
                "    .sig-line { margin-top: 60px; border-bottom: 1px solid #334155; font-weight: 700; padding-bottom: 2px; }\n" +
                "    .print-bar { position: sticky; top: 10px; z-index: 100; background: #0f172a; color: #fff; padding: 12px 18px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }\n" +
                "    .print-btn { background: #10b981; color: #fff; border: none; padding: 8px 18px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 13px; }\n" +
                "    .print-btn:hover { background: #059669; }\n" +
                "    .doc-boundary { margin-bottom: 30px; padding-bottom: 25px; }\n" +
                "    .page-break { page-break-after: always; break-after: page; height: 1px; margin: 30px 0; border-bottom: 2px dashed #94a3b8; }\n" +
                "    @media print {\n" +
                "      .no-print { display: none !important; }\n" +
                "      body { margin: 0; padding: 10mm; font-size: 11pt; }\n" +
                "      .page-break { page-break-after: always !important; break-after: page !important; height: 0 !important; margin: 0 !important; border: none !important; }\n" +
                "      .doc-boundary { margin: 0; padding: 0; }\n" +
                "    }\n" +
                "  </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "  <div class=\"print-bar no-print\">\n" +
                "    <span><strong>Cetak Massal (" + count + " Dokumen):</strong> " + title + "</span>\n" +
                "    <button class=\"print-btn\" onclick=\"window.print()\">Cetak Semua (" + count + " Halaman)</button>\n" +
                "  </div>\n" +
                content +
                "</body>\n" +
                "</html>";
    }

    /** 1. Official Surat Jalan (Delivery Order) */
    public String generateSuratJalanHtml(UUID deliveryOrderId) {
        DeliveryOrder order = deliveryOrderRepository.findById(deliveryOrderId)
                .orElseThrow(() -> new NotFoundException("Delivery Order not found: " + deliveryOrderId));
        return baseHtml("Surat Jalan " + order.getDeliveryOrderNumber(), generateSuratJalanContent(order));
    }

    private String generateSuratJalanContent(DeliveryOrder order) {
        SalesOrder so = order.getSalesOrder();
        String storeName = so.getStore() != null ? so.getStore().getName() : "Pusat Jaya Store";
        String driverName = order.getDeliveryTrip() != null && order.getDeliveryTrip().getDriver() != null
                ? order.getDeliveryTrip().getDriver().getFullName() : "Assigned Driver";
        String vehiclePlate = order.getDeliveryTrip() != null ? order.getDeliveryTrip().getVehiclePlate() : "-";

        StringBuilder itemRows = new StringBuilder();
        int idx = 1;
        for (DeliveryItem item : order.getItems()) {
            String variantName = "Electronics / Furniture Unit";
            String sn = "SN-PENDING";
            if (item.getSoItemStockUnit() != null) {
                if (item.getSoItemStockUnit().getStockUnit() != null) {
                    sn = item.getSoItemStockUnit().getStockUnit().getManufacturerSerial() != null
                            ? item.getSoItemStockUnit().getStockUnit().getManufacturerSerial()
                            : "SN-PENDING";
                }
                if (item.getSoItemStockUnit().getSalesOrderItem() != null &&
                        item.getSoItemStockUnit().getSalesOrderItem().getProductVariant() != null) {
                    variantName = item.getSoItemStockUnit().getSalesOrderItem().getProductVariant().getVariantName();
                }
            }
            itemRows.append("<tr>")
                    .append("<td class=\"text-center\">").append(idx++).append("</td>")
                    .append("<td>").append(variantName).append("</td>")
                    .append("<td><strong>").append(sn).append("</strong></td>")
                    .append("<td class=\"text-center\">1 Unit</td>")
                    .append("<td class=\"text-center\">").append(item.getStatus()).append("</td>")
                    .append("</tr>");
        }

        return "<div class=\"doc-boundary\">\n" +
                "<div class=\"header\">\n" +
                "  <div>\n" +
                "    <div class=\"store-name\">" + storeName + "</div>\n" +
                "    <div class=\"store-info\">Retail Elektronik & Furnitur • Multi-Store Branch Network<br/>Layanan Pengiriman Resmi & Instalasi</div>\n" +
                "  </div>\n" +
                "  <div class=\"doc-title\">\n" +
                "    <div class=\"doc-name\">SURAT JALAN</div>\n" +
                "    <div class=\"doc-number\">" + order.getDeliveryOrderNumber() + "</div>\n" +
                "    <div class=\"store-info\">Ref SO: " + so.getNumber() + " • Stop #" + order.getStopSequence() + "</div>\n" +
                "  </div>\n" +
                "</div>\n" +

                "<div style=\"display: flex; justify-content: space-between; margin-bottom: 16px;\">\n" +
                "  <div style=\"width: 48%;\">\n" +
                "    <div class=\"section-title\">Penerima / Tujuan</div>\n" +
                "    <strong>" + order.getRecipientName() + "</strong><br/>\n" +
                "    Telp: " + order.getRecipientPhone() + "<br/>\n" +
                "    Alamat Pengiriman:<br/>" + order.getDestinationAddress() + "\n" +
                "  </div>\n" +
                "  <div style=\"width: 48%;\">\n" +
                "    <div class=\"section-title\">Informasi Armada & Ekspedisi</div>\n" +
                "    Pengemudi (Driver): <strong>" + driverName + "</strong><br/>\n" +
                "    Nomor Polisi: <strong>" + vehiclePlate + "</strong><br/>\n" +
                "    Pre-Inspeksi Toko: " + (order.isPreInspectionPassed() ? "<span style=\"color:#059669;font-weight:700;\">PASSED (Lolos Cek Fisik)</span>" : "Belum") + "<br/>\n" +
                "    Tagihan COD: <strong>" + formatRp(order.getCodAmount()) + "</strong>\n" +
                "  </div>\n" +
                "</div>\n" +

                "<div class=\"section\">\n" +
                "  <div class=\"section-title\">Rincian Barang yang Dikirim</div>\n" +
                "  <table class=\"data-table\">\n" +
                "    <thead>\n" +
                "      <tr>\n" +
                "        <th style=\"width: 40px;\" class=\"text-center\">No</th>\n" +
                "        <th>Nama Barang / Varian</th>\n" +
                "        <th>Nomor Seri (Serial Number)</th>\n" +
                "        <th style=\"width: 80px;\" class=\"text-center\">Kuantitas</th>\n" +
                "        <th style=\"width: 100px;\" class=\"text-center\">Status</th>\n" +
                "      </tr>\n" +
                "    </thead>\n" +
                "    <tbody>" + itemRows + "</tbody>\n" +
                "  </table>\n" +
                "</div>\n" +

                "<div style=\"font-size: 11px; color: #475569; margin-top: 14px; padding: 8px; background: #f8fafc; border-left: 3px solid #0284c7;\">\n" +
                "  <strong>Perhatian Penerima:</strong> Mohon periksa keutuhan fisik barang dan kelengkapan kartu garansi sebelum menandatangani Surat Jalan. Tanda tangan di bawah membuktikan barang telah diterima dalam kondisi prima dan berfungsi baik.\n" +
                "</div>\n" +

                "<div class=\"signatures\">\n" +
                "  <div class=\"sig-box\">\n" +
                "    <div>Pengirim / Bag. Gudang</div>\n" +
                "    <div class=\"sig-line\">( Admin Logistik )</div>\n" +
                "  </div>\n" +
                "  <div class=\"sig-box\">\n" +
                "    <div>Pengemudi / Kurir</div>\n" +
                "    <div class=\"sig-line\">( " + driverName + " )</div>\n" +
                "  </div>\n" +
                "  <div class=\"sig-box\">\n" +
                "    <div>Penerima Barang</div>\n" +
                "    <div class=\"sig-line\">( " + order.getRecipientName() + " )</div>\n" +
                "  </div>\n" +
                "</div>\n" +
                "</div>";
    }

    /** 2. Official Credit Sales Order Agreement Contract */
    public String generateCreditAgreementHtml(UUID salesOrderId) {
        SalesOrder so = salesOrderRepository.findById(salesOrderId)
                .orElseThrow(() -> new NotFoundException("Sales Order not found: " + salesOrderId));
        return baseHtml("Perjanjian Kredit " + so.getNumber(), generateCreditAgreementContent(so));
    }

    private String generateCreditAgreementContent(SalesOrder so) {
        Customer c = so.getCustomer();
        List<SalesOrderItem> items = salesOrderItemRepository.findBySalesOrderId(so.getId());
        String storeName = so.getStore() != null ? so.getStore().getName() : "Pusat Jaya Store";
        String dateStr = so.getReleasedAt() != null
                ? DATE_FMT.format(so.getReleasedAt().atZone(ZoneId.systemDefault()))
                : DATE_FMT.format(java.time.LocalDate.now());

        BigDecimal grandTotal = BigDecimal.ZERO;
        int maxTerm = 0;
        StringBuilder itemRows = new StringBuilder();
        int idx = 1;
        for (SalesOrderItem item : items) {
            BigDecimal lineTotal = item.getFinalPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            grandTotal = grandTotal.add(lineTotal);
            if (item.getPaymentTermMonths() > maxTerm) maxTerm = item.getPaymentTermMonths();

            itemRows.append("<tr>")
                    .append("<td class=\"text-center\">").append(idx++).append("</td>")
                    .append("<td>").append(item.getProductVariant() != null ? item.getProductVariant().getVariantName() : "Unit").append("</td>")
                    .append("<td class=\"text-center\">").append(item.getQuantity()).append("</td>")
                    .append("<td class=\"text-right\">").append(formatRp(item.getFinalPrice())).append("</td>")
                    .append("<td class=\"text-center\">").append(item.getPaymentTermMonths()).append(" Bln</td>")
                    .append("<td class=\"text-right\">").append(formatRp(lineTotal)).append("</td>")
                    .append("</tr>");
        }

        BigDecimal monthlyEst = maxTerm > 0 ? grandTotal.divide(BigDecimal.valueOf(maxTerm), java.math.RoundingMode.HALF_UP) : grandTotal;

        return "<div class=\"doc-boundary\">\n" +
                "<div class=\"header\">\n" +
                "  <div>\n" +
                "    <div class=\"store-name\">" + storeName + "</div>\n" +
                "    <div class=\"store-info\">Perjanjian Pembiayaan Konsumen & Penjualan Kredit Resmi</div>\n" +
                "  </div>\n" +
                "  <div class=\"doc-title\">\n" +
                "    <div class=\"doc-name\">AKTA PERJANJIAN KREDIT</div>\n" +
                "    <div class=\"doc-number\">NO: " + (so.getNumber() != null ? so.getNumber() : "DRAFT-SO") + "</div>\n" +
                "    <div class=\"store-info\">Tanggal: " + dateStr + "</div>\n" +
                "  </div>\n" +
                "</div>\n" +

                "<p style=\"font-size: 12px; margin-bottom: 12px;\">Pada hari ini, tanggal <strong>" + dateStr + "</strong>, telah dibuat dan disepakati perjanjian kredit konsumen antara:</p>\n" +
                "<div style=\"padding-left: 14px; font-size: 12px; margin-bottom: 14px;\">\n" +
                "  1. <strong>" + storeName + "</strong>, berkedudukan sebagai <strong>PIHAK PERTAMA (KREDITUR/PENJUAL)</strong>.<br/>\n" +
                "  2. <strong>" + (c != null ? c.getFullName() : "Customer") + "</strong>, NIK: <strong>" + (c != null ? c.getNik() : "-") + "</strong>, Alamat: <strong>" + (so.getDeliveryAddressSnapshot() != null ? so.getDeliveryAddressSnapshot() : "-") + "</strong>, selanjutnya disebut sebagai <strong>PIHAK KEDUA (DEBITUR/KONSUMEN)</strong>.\n" +
                "</div>\n" +

                "<div class=\"section\">\n" +
                "  <div class=\"section-title\">Pasal 1: Objek Pembelian & Skema Angsuran</div>\n" +
                "  <table class=\"data-table\">\n" +
                "    <thead>\n" +
                "      <tr>\n" +
                "        <th style=\"width: 30px;\" class=\"text-center\">No</th>\n" +
                "        <th>Deskripsi Barang</th>\n" +
                "        <th style=\"width: 50px;\" class=\"text-center\">Qty</th>\n" +
                "        <th class=\"text-right\">Harga Unit</th>\n" +
                "        <th style=\"width: 70px;\" class=\"text-center\">Tenor</th>\n" +
                "        <th class=\"text-right\">Total Pembiayaan</th>\n" +
                "      </tr>\n" +
                "    </thead>\n" +
                "    <tbody>" + itemRows + "</tbody>\n" +
                "    <tfoot>\n" +
                "      <tr>\n" +
                "        <th colspan=\"5\" class=\"text-right\">Total Pembiayaan Kredit:</th>\n" +
                "        <th class=\"text-right\" style=\"color: #1e3a8a; font-size: 13px;\">" + formatRp(grandTotal) + "</th>\n" +
                "      </tr>\n" +
                "      <tr>\n" +
                "        <th colspan=\"5\" class=\"text-right\">Estimasi Angsuran per Bulan (" + maxTerm + " Bulan):</th>\n" +
                "        <th class=\"text-right\" style=\"color: #059669; font-size: 13px;\">" + formatRp(monthlyEst) + " / bln</th>\n" +
                "      </tr>\n" +
                "    </tfoot>\n" +
                "  </table>\n" +
                "</div>\n" +

                "<div class=\"section\" style=\"font-size: 11px; text-align: justify;\">\n" +
                "  <div class=\"section-title\">Pasal 2: Ketentuan Hak Milik & Penarikan Barang (Repossession)</div>\n" +
                "  <ol style=\"padding-left: 18px; margin: 6px 0;\">\n" +
                "    <li><strong>Hak Milik Barang:</strong> Hak milik atas barang yang tercantum pada Pasal 1 tetap berada pada PIHAK PERTAMA sampai seluruh kewajiban angsuran dilunasi secara penuh oleh PIHAK KEDUA.</li>\n" +
                "    <li><strong>Larangan Pengalihan:</strong> Selama masa kredit berjalan, PIHAK KEDUA dilarang menjual, menggadaikan, menyewakan, atau memindahtangankan barang kepada pihak ketiga tanpa persetujuan tertulis PIHAK PERTAMA.</li>\n" +
                "    <li><strong>Keterlambatan & Wanprestasi:</strong> Keterlambatan pembayaran angsuran melampaui tanggal jatuh tempo dikenakan peringatan dan kunjungan penagihan. Apabila keterlambatan mencapai batas default (60 hari), PIHAK PERTAMA berhak penuh melakukan penarikan kembali (repossession) fisik barang.</li>\n" +
                "    <li><strong>Pembayaran Terdahulu:</strong> Sesuai regulasi ritel resmi, seluruh angsuran dan uang muka yang telah disetorkan sebelum penarikan barang tidak dapat ditarik kembali/dikembalikan (non-refundable) dan sisa pokok hutang dinyatakan lunas tuntas (settled via repossession).</li>\n" +
                "  </ol>\n" +
                "</div>\n" +

                "<div class=\"signatures\">\n" +
                "  <div class=\"sig-box\">\n" +
                "    <div>PIHAK PERTAMA (Kreditur)</div>\n" +
                "    <div class=\"sig-line\">( Kepala Cabang Toko )</div>\n" +
                "  </div>\n" +
                "  <div class=\"sig-box\">\n" +
                "    <div>Saksi / Sales Surveyor</div>\n" +
                "    <div class=\"sig-line\">( Petugas Surveyor )</div>\n" +
                "  </div>\n" +
                "  <div class=\"sig-box\">\n" +
                "    <div>PIHAK KEDUA (Debitur/Konsumen)</div>\n" +
                "    <div class=\"sig-line\">( " + (c != null ? c.getFullName() : "Customer") + " )</div>\n" +
                "  </div>\n" +
                "</div>\n" +
                "</div>";
    }

    /** 3. Official Sales Order Invoice / Nota Penjualan */
    public String generateSalesOrderInvoiceHtml(UUID salesOrderId) {
        SalesOrder so = salesOrderRepository.findById(salesOrderId)
                .orElseThrow(() -> new NotFoundException("Sales Order not found: " + salesOrderId));
        return baseHtml("Faktur Penjualan " + (so.getNumber() != null ? so.getNumber() : "DRAFT"),
                generateSalesOrderInvoiceContent(so));
    }

    private String generateSalesOrderInvoiceContent(SalesOrder so) {
        Customer c = so.getCustomer();
        List<SalesOrderItem> items = salesOrderItemRepository.findBySalesOrderId(so.getId());
        String storeName = so.getStore() != null ? so.getStore().getName() : "Pusat Jaya Store";
        String dateStr = so.getCreatedAt() != null
                ? DATE_FMT.format(so.getCreatedAt().atZone(ZoneId.systemDefault()))
                : DATE_FMT.format(java.time.LocalDate.now());

        BigDecimal grandTotal = BigDecimal.ZERO;
        StringBuilder itemRows = new StringBuilder();
        int idx = 1;
        for (SalesOrderItem item : items) {
            BigDecimal lineTotal = item.getFinalPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            grandTotal = grandTotal.add(lineTotal);

            itemRows.append("<tr>")
                    .append("<td class=\"text-center\">").append(idx++).append("</td>")
                    .append("<td>").append(item.getProductVariant() != null ? item.getProductVariant().getVariantName() : "Unit").append("</td>")
                    .append("<td class=\"text-center\">").append(item.getQuantity()).append("</td>")
                    .append("<td class=\"text-right\">").append(formatRp(item.getFinalPrice())).append("</td>")
                    .append("<td class=\"text-right\">").append(formatRp(lineTotal)).append("</td>")
                    .append("</tr>");
        }

        BigDecimal dp = so.getRequiredDepositAmount() != null ? so.getRequiredDepositAmount() : BigDecimal.ZERO;
        BigDecimal sisa = grandTotal.subtract(dp);
        if (sisa.compareTo(BigDecimal.ZERO) < 0) sisa = BigDecimal.ZERO;

        return "<div class=\"doc-boundary\">\n" +
                "<div class=\"header\">\n" +
                "  <div>\n" +
                "    <div class=\"store-name\">" + storeName + "</div>\n" +
                "    <div class=\"store-info\">Retail Elektronik & Furnitur Terintegrasi<br/>Faktur Pembelian & Bukti Transaksi Resmi</div>\n" +
                "  </div>\n" +
                "  <div class=\"doc-title\">\n" +
                "    <div class=\"doc-name\">FAKTUR PENJUALAN</div>\n" +
                "    <div class=\"doc-number\">" + (so.getNumber() != null ? so.getNumber() : "(DRAFT)") + "</div>\n" +
                "    <div class=\"store-info\">Status: " + so.getStatus() + " • Sumber: " + so.getOrderSource() + "</div>\n" +
                "  </div>\n" +
                "</div>\n" +
                "<div style=\"display:flex; justify-content:space-between; margin-bottom:16px;\">\n" +
                "  <div style=\"width:48%;\">\n" +
                "    <div class=\"section-title\">Informasi Pembeli</div>\n" +
                "    <strong>" + (c != null ? c.getFullName() : "-") + "</strong><br/>\n" +
                "    Telp: " + (c != null && c.getPrimaryPhone() != null ? c.getPrimaryPhone() : "-") + "<br/>\n" +
                "    Alamat Pengiriman:<br/>" + (so.getDeliveryAddress() != null ? so.getDeliveryAddress().getAddressLine() : "-") + "\n" +
                "  </div>\n" +
                "  <div style=\"width:48%;\">\n" +
                "    <div class=\"section-title\">Informasi Pesanan</div>\n" +
                "    Tanggal: <strong>" + dateStr + "</strong><br/>\n" +
                "    Metode Bayar: <strong>" + (so.getPaymentMethod() != null ? so.getPaymentMethod() : "KASIR / DIGITAL") + "</strong><br/>\n" +
                "    Skema: <strong>" + (so.isRequiresPriceApproval() ? "Kredit / Nego Disetujui" : "Tunai / Standar") + "</strong>\n" +
                "  </div>\n" +
                "</div>\n" +
                "<div class=\"section\">\n" +
                "  <div class=\"section-title\">Rincian Produk</div>\n" +
                "  <table class=\"data-table\">\n" +
                "    <thead>\n" +
                "      <tr>\n" +
                "        <th style=\"width:40px;\" class=\"text-center\">No</th>\n" +
                "        <th>Nama Barang / Varian Model</th>\n" +
                "        <th style=\"width:60px;\" class=\"text-center\">Qty</th>\n" +
                "        <th style=\"width:130px;\" class=\"text-right\">Harga Satuan</th>\n" +
                "        <th style=\"width:140px;\" class=\"text-right\">Subtotal</th>\n" +
                "      </tr>\n" +
                "    </thead>\n" +
                "    <tbody>\n" + itemRows + "</tbody>\n" +
                "    <tfoot>\n" +
                "      <tr>\n" +
                "        <td colspan=\"4\" class=\"text-right\"><strong>Total Pembelian</strong></td>\n" +
                "        <td class=\"text-right\"><strong>" + formatRp(grandTotal) + "</strong></td>\n" +
                "      </tr>\n" +
                "      <tr>\n" +
                "        <td colspan=\"4\" class=\"text-right\">Uang Muka (DP) Terbayar</td>\n" +
                "        <td class=\"text-right\">" + formatRp(dp) + "</td>\n" +
                "      </tr>\n" +
                "      <tr style=\"background:#f8fafc;\">\n" +
                "        <td colspan=\"4\" class=\"text-right\"><strong>Sisa Pelunasan</strong></td>\n" +
                "        <td class=\"text-right\"><strong style=\"color:" + (sisa.compareTo(BigDecimal.ZERO) == 0 ? "#059669" : "#dc2626") + ";\">" + formatRp(sisa) + "</strong></td>\n" +
                "      </tr>\n" +
                "    </tfoot>\n" +
                "  </table>\n" +
                "</div>\n" +
                "<div style=\"font-size:11px; color:#475569; margin-top:14px; padding:8px; background:#f8fafc; border-left:3px solid #059669;\">\n" +
                "  <strong>Syarat & Ketentuan:</strong> Simpan faktur ini sebagai bukti pembelian yang sah untuk klaim garansi toko atau pabrik. Periksa fisik barang pada saat serah terima di toko atau saat diterima dari kurir pengiriman.\n" +
                "</div>\n" +
                "<div class=\"signatures\">\n" +
                "  <div class=\"sig-box\">\n" +
                "    <div>Pramuniaga / Kasir Toko</div>\n" +
                "    <div class=\"sig-line\">( Staf Penjualan )</div>\n" +
                "  </div>\n" +
                "  <div class=\"sig-box\">\n" +
                "    <div>Pelanggan / Pembeli</div>\n" +
                "    <div class=\"sig-line\">( " + (c != null ? c.getFullName() : "Konsumen") + " )</div>\n" +
                "  </div>\n" +
                "</div>\n" +
                "</div>";
    }

    /** 4. Official Customer Payment Receipt (Kuitansi Pembayaran) */
    public String generatePaymentReceiptHtml(UUID paymentId) {
        CustomerPayment payment = customerPaymentRepository.findById(paymentId)
                .orElseThrow(() -> new NotFoundException("Payment not found: " + paymentId));
        return baseHtml("Kuitansi " + payment.getPaymentNumber(), generatePaymentReceiptContent(payment));
    }

    private String generatePaymentReceiptContent(CustomerPayment payment) {
        String storeName = payment.getStore() != null ? payment.getStore().getName() : "Pusat Jaya Store";
        String dateStr = payment.getCreatedAt() != null
                ? DATE_FMT.format(payment.getCreatedAt().atZone(ZoneId.systemDefault()))
                : DATE_FMT.format(java.time.LocalDate.now());

        String terbilang = TerbilangHelper.toWords(payment.getAmount().longValue());

        StringBuilder allocRows = new StringBuilder();
        int idx = 1;
        for (PaymentAllocation a : payment.getAllocations()) {
            allocRows.append("<tr>")
                    .append("<td class=\"text-center\">").append(idx++).append("</td>")
                    .append("<td>Angsuran Ke-").append(a.getReceivableInstallment().getInstallmentNumber()).append("</td>")
                    .append("<td>").append(a.getReceivableInstallment().getReceivable().getReceivableNumber()).append("</td>")
                    .append("<td class=\"text-right\"><strong>").append(formatRp(a.getAmount())).append("</strong></td>")
                    .append("</tr>");
        }

        return "<div class=\"doc-boundary\">\n" +
                "<div class=\"header\">\n" +
                "  <div>\n" +
                "    <div class=\"store-name\">" + storeName + "</div>\n" +
                "    <div class=\"store-info\">Tanda Bukti Pembayaran Sah • Unit Kasir Keuangan</div>\n" +
                "  </div>\n" +
                "  <div class=\"doc-title\">\n" +
                "    <div class=\"doc-name\">KUITANSI PEMBAYARAN</div>\n" +
                "    <div class=\"doc-number\">" + payment.getPaymentNumber() + "</div>\n" +
                "    <div class=\"store-info\">Tanggal: " + dateStr + "</div>\n" +
                "  </div>\n" +
                "</div>\n" +

                "<table style=\"width: 100%; font-size: 13px; line-height: 2; margin-bottom: 16px;\">\n" +
                "  <tr><td style=\"width: 160px;\">Telah Diterima Dari:</td><td><strong>" + payment.getCustomer().getFullName() + "</strong> (NIK: " + (payment.getCustomer().getNik() != null ? payment.getCustomer().getNik() : "-") + ")</td></tr>\n" +
                "  <tr><td>Uang Sejumlah:</td><td style=\"background:#f8fafc; padding: 4px 8px; border-radius: 4px; font-style: italic; font-weight: 700; color: #1e3a8a;\">\" " + terbilang + " \"</td></tr>\n" +
                "  <tr><td>Untuk Pembayaran:</td><td>" + payment.getPaymentType() + " (" + payment.getPaymentMethod() + ") • Ref: " + (payment.getReferenceNumber() != null ? payment.getReferenceNumber() : "-") + "</td></tr>\n" +
                "</table>\n" +

                (payment.getAllocations().isEmpty() ? "" :
                "<div class=\"section\">\n" +
                "  <div class=\"section-title\">Alokasi Pembayaran Angsuran</div>\n" +
                "  <table class=\"data-table\">\n" +
                "    <thead>\n" +
                "      <tr>\n" +
                "        <th style=\"width: 40px;\" class=\"text-center\">No</th>\n" +
                "        <th>Deskripsi Angsuran</th>\n" +
                "        <th>Nomor Rekening Piutang</th>\n" +
                "        <th class=\"text-right\">Jumlah Terbayar</th>\n" +
                "      </tr>\n" +
                "    </thead>\n" +
                "    <tbody>" + allocRows + "</tbody>\n" +
                "  </table>\n" +
                "</div>\n") +

                "<div style=\"display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px;\">\n" +
                "  <div style=\"font-size: 20px; font-weight: 800; color: #059669; border: 2px solid #059669; padding: 10px 20px; border-radius: 8px; display: inline-block;\">\n" +
                "    " + formatRp(payment.getAmount()) + "\n" +
                "  </div>\n" +
                "  <div style=\"width: 220px; text-align: center; font-size: 11px;\">\n" +
                "    <div>Petugas Kasir / Kolektor Resmi</div>\n" +
                "    <div style=\"margin-top: 60px; border-bottom: 1px solid #334155; font-weight: 700;\">( Bagian Keuangan )</div>\n" +
                "    <div style=\"font-size: 9px; color: #64748b; margin-top: 2px;\">Stempel & Tanda Tangan Sah</div>\n" +
                "  </div>\n" +
                "</div>\n" +
                "</div>";
    }

    /** 5. Official Employee Monthly Payroll Slip */
    public String generatePayrollSlipHtml(UUID slipId) {
        PayrollSlip slip = payrollSlipRepository.findById(slipId)
                .orElseThrow(() -> new NotFoundException("Payroll Slip not found: " + slipId));
        return baseHtml("Slip Gaji " + slip.getEmployee().getFullName(), generatePayrollSlipContent(slip));
    }

    private String generatePayrollSlipContent(PayrollSlip slip) {
        String empName = slip.getEmployee().getFullName();
        String periodName = slip.getPayrollPeriod().getName();
        String dateRange = DATE_FMT.format(slip.getPayrollPeriod().getStartDate()) + " s/d " + DATE_FMT.format(slip.getPayrollPeriod().getEndDate());

        return "<div class=\"doc-boundary\">\n" +
                "<div class=\"header\">\n" +
                "  <div>\n" +
                "    <div class=\"store-name\">SLIP GAJI KARYAWAN (PAYROLL SLIP)</div>\n" +
                "    <div class=\"store-info\">Periode Non-Kalender: " + periodName + " (" + dateRange + ")</div>\n" +
                "  </div>\n" +
                "  <div class=\"doc-title\">\n" +
                "    <div class=\"doc-number\">" + slip.getSlipNumber() + "</div>\n" +
                "    <div class=\"store-info\" style=\"color:#059669;font-weight:700;\">STATUS: " + slip.getPaymentStatus() + "</div>\n" +
                "  </div>\n" +
                "</div>\n" +

                "<div style=\"display: flex; justify-content: space-between; margin-bottom: 16px;\">\n" +
                "  <div>\n" +
                "    Nama Karyawan: <strong>" + empName + "</strong><br/>\n" +
                "    Nomor Induk: " + slip.getEmployee().getEmployeeNumber() + "\n" +
                "  </div>\n" +
                "  <div class=\"text-right\">\n" +
                "    Tanggal Cut-off: " + DATE_FMT.format(slip.getPayrollPeriod().getCutoffDate()) + "<br/>\n" +
                "    Tanggal Pembayaran: " + DATE_FMT.format(slip.getPayrollPeriod().getPayoutDate()) + "\n" +
                "  </div>\n" +
                "</div>\n" +

                "<div class=\"section\">\n" +
                "  <div class=\"section-title\">Rincian Penghasilan & Komisi</div>\n" +
                "  <table class=\"data-table\">\n" +
                "    <tr><td>Gaji Pokok (Prorata Kehadiran)</td><td class=\"text-right\"><strong>" + formatRp(slip.getBaseSalary()) + "</strong></td></tr>\n" +
                "    <tr><td>Komisi Penjualan Sah (Sales Commission)</td><td class=\"text-right\"><strong>" + formatRp(slip.getSalesCommission()) + "</strong></td></tr>\n" +
                "    <tr><td>Insentif Kolektor & Penagihan (Collection Incentive)</td><td class=\"text-right\"><strong>" + formatRp(slip.getCollectionIncentive()) + "</strong></td></tr>\n" +
                "    <tr><td>Tunjangan Operasional & Transportasi</td><td class=\"text-right\"><strong>" + formatRp(slip.getAllowances()) + "</strong></td></tr>\n" +
                "    <tr style=\"background:#f8fafc;\"><td><strong>Total Penghasilan Kotor (Gross)</strong></td><td class=\"text-right\"><strong>" + formatRp(slip.getBaseSalary().add(slip.getSalesCommission()).add(slip.getCollectionIncentive()).add(slip.getAllowances())) + "</strong></td></tr>\n" +
                "  </table>\n" +
                "</div>\n" +

                "<div class=\"section\">\n" +
                "  <div class=\"section-title\">Potongan</div>\n" +
                "  <table class=\"data-table\">\n" +
                "    <tr><td>Potongan Ketidakhadiran / Keterlambatan / Pinjaman</td><td class=\"text-right\" style=\"color:#dc2626;\">- " + formatRp(slip.getDeductions()) + "</td></tr>\n" +
                "  </table>\n" +
                "</div>\n" +

                "<div style=\"display:flex; justify-content:space-between; align-items:center; background:#0f172a; color:#fff; padding:16px; border-radius:8px; margin-top:20px;\">\n" +
                "  <div>\n" +
                "    <div style=\"font-size:12px; color:#94a3b8;\">PENGHASILAN BERSIH YANG DITERIMA:</div>\n" +
                "    <div style=\"font-size:22px; font-weight:800; color:#34d399;\">" + formatRp(slip.getNetSalary()) + "</div>\n" +
                "  </div>\n" +
                "  <div style=\"font-size:11px; text-align:right; color:#cbd5e1;\">\n" +
                "    Ditransfer via Payroll Bank Resmi<br/>Kompensasi Mengikat & Tidak Berubah\n" +
                "  </div>\n" +
                "</div>\n" +
                "</div>";
    }

    /** 6. Formal Repossession Notice & Handover Letter */
    public String generateRepossessionNoticeHtml(UUID returnId) {
        StockReturn sr = stockReturnRepository.findById(returnId)
                .orElseThrow(() -> new NotFoundException("Return/Repossession record not found: " + returnId));
        return baseHtml("Berita Acara Penarikan " + sr.getReturnNumber(), generateRepossessionNoticeContent(sr));
    }

    private String generateRepossessionNoticeContent(StockReturn sr) {
        String storeName = sr.getStore() != null ? sr.getStore().getName() : "Pusat Jaya Store";
        String dateStr = sr.getScheduledDate() != null
                ? DATE_FMT.format(sr.getScheduledDate())
                : DATE_FMT.format(java.time.LocalDate.now());

        return "<div class=\"doc-boundary\">\n" +
                "<div class=\"header\">\n" +
                "  <div>\n" +
                "    <div class=\"store-name\">" + storeName + "</div>\n" +
                "    <div class=\"store-info\">Unit Penyelesaian Piutang Macet & Pemulihan Aset Ritel</div>\n" +
                "  </div>\n" +
                "  <div class=\"doc-title\">\n" +
                "    <div class=\"doc-name\">BERITA ACARA PENARIKAN BARANG</div>\n" +
                "    <div class=\"doc-number\">NO: " + sr.getReturnNumber() + "</div>\n" +
                "    <div class=\"store-info\">Tanggal: " + dateStr + "</div>\n" +
                "  </div>\n" +
                "</div>\n" +

                "<p style=\"font-size:12px;\">Telah dilakukan penarikan kembali (repossession) atas unit barang titipan sehubungan dengan wanprestasi keterlambatan angsuran konsumen:</p>\n" +
                "<div style=\"padding-left:14px; font-size:12px; margin-bottom:14px; line-height:1.8;\">\n" +
                "  Nama Debitur: <strong>" + sr.getCustomer().getFullName() + "</strong> (NIK: " + (sr.getCustomer().getNik() != null ? sr.getCustomer().getNik() : "-") + ")<br/>\n" +
                "  Alasan Penarikan: <strong>" + sr.getReason() + " (" + sr.getReturnType() + ")</strong><br/>\n" +
                "  Catatan Kondisi Fisik: <i>" + (sr.getNotes() != null ? sr.getNotes() : (sr.getReason() != null ? sr.getReason() : "Diterima untuk inspeksi teknis")) + "</i>\n" +
                "</div>\n" +

                "<div class=\"section\">\n" +
                "  <div class=\"section-title\">Rincian Unit yang Ditarik</div>\n" +
                "  <table class=\"data-table\">\n" +
                "    <thead>\n" +
                "      <tr>\n" +
                "        <th>Tipe Barang</th>\n" +
                "        <th>Nomor Seri Unit (Serial Number)</th>\n" +
                "        <th>Lokasi Penerimaan Gudang</th>\n" +
                "        <th>Status Pembiayaan</th>\n" +
                "      </tr>\n" +
                "    </thead>\n" +
                "    <tbody>\n" +
                "      <tr>\n" +
                "        <td>" + (sr.getStockUnit() != null && sr.getStockUnit().getProductVariant() != null ? sr.getStockUnit().getProductVariant().getVariantName() : "Unit Elektronik / Furnitur") + "</td>\n" +
                "        <td><strong>" + (sr.getStockUnit() != null && sr.getStockUnit().getManufacturerSerial() != null ? sr.getStockUnit().getManufacturerSerial() : "-") + "</strong></td>\n" +
                "        <td>Area Reparasi / Showroom</td>\n" +
                "        <td><strong style=\"color:#059669;\">SETTLED (Lunas via Reposisi)</strong></td>\n" +
                "      </tr>\n" +
                "    </tbody>\n" +
                "  </table>\n" +
                "</div>\n" +

                "<div style=\"font-size: 11px; color: #475569; margin-top: 14px; padding: 10px; background: #fef2f2; border-left: 3px solid #dc2626;\">\n" +
                "  <strong>Ketetapan Finansial:</strong> Berdasarkan klausul Akta Kredit, penarikan unit ini secara sah mengakhiri sisa kewajiban angsuran konsumen (forgiven). Seluruh dana angsuran terdahulu tidak dikembalikan, dan kepemilikan fisik unit sepenuhnya beralih kembali ke pihak toko untuk dilakukan grading (jual as-is / rekondisi / scrap).\n" +
                "</div>\n" +

                "<div class=\"signatures\">\n" +
                "  <div class=\"sig-box\">\n" +
                "    <div>Petugas Penarikan / Kolektor</div>\n" +
                "    <div class=\"sig-line\">( Petugas Lapangan )</div>\n" +
                "  </div>\n" +
                "  <div class=\"sig-box\">\n" +
                "    <div>Saksi / Pihak Debitur</div>\n" +
                "    <div class=\"sig-line\">( " + sr.getCustomer().getFullName() + " )</div>\n" +
                "  </div>\n" +
                "  <div class=\"sig-box\">\n" +
                "    <div>Penerima Gudang Toko</div>\n" +
                "    <div class=\"sig-line\">( Kepala Gudang )</div>\n" +
                "  </div>\n" +
                "</div>\n" +
                "</div>";
    }

    /** 7. Universal Bulk Document HTML Generator */
    public String generateBulkHtml(String documentType, List<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return baseHtml("Cetak Massal", "<p>Tidak ada dokumen yang dipilih untuk dicetak.</p>");
        }

        StringBuilder bulkContent = new StringBuilder();
        int count = 0;
        for (UUID id : ids) {
            try {
                String singleDocContent = null;
                switch (documentType.toUpperCase()) {
                    case "SURAT_JALAN" -> {
                        DeliveryOrder order = deliveryOrderRepository.findById(id)
                                .orElseThrow(() -> new NotFoundException("Delivery Order not found: " + id));
                        singleDocContent = generateSuratJalanContent(order);
                    }
                    case "CREDIT_AGREEMENT" -> {
                        SalesOrder so = salesOrderRepository.findById(id)
                                .orElseThrow(() -> new NotFoundException("Sales Order not found: " + id));
                        singleDocContent = generateCreditAgreementContent(so);
                    }
                    case "SALES_ORDER_INVOICE", "INVOICE" -> {
                        SalesOrder so = salesOrderRepository.findById(id)
                                .orElseThrow(() -> new NotFoundException("Sales Order not found: " + id));
                        singleDocContent = generateSalesOrderInvoiceContent(so);
                    }
                    case "PAYMENT_RECEIPT", "RECEIPT" -> {
                        CustomerPayment payment = customerPaymentRepository.findById(id)
                                .orElseThrow(() -> new NotFoundException("Payment not found: " + id));
                        singleDocContent = generatePaymentReceiptContent(payment);
                    }
                    case "PAYROLL_SLIP" -> {
                        PayrollSlip slip = payrollSlipRepository.findById(id)
                                .orElseThrow(() -> new NotFoundException("Payroll Slip not found: " + id));
                        singleDocContent = generatePayrollSlipContent(slip);
                    }
                    case "REPOSSESSION_NOTICE" -> {
                        StockReturn sr = stockReturnRepository.findById(id)
                                .orElseThrow(() -> new NotFoundException("Return not found: " + id));
                        singleDocContent = generateRepossessionNoticeContent(sr);
                    }
                    case "CUSTOMER_STATEMENT", "STATEMENT", "BILLING_STATEMENT" -> {
                        Customer c = customerRepository.findById(id).orElse(null);
                        if (c != null) {
                            singleDocContent = generateCustomerBillingStatementContent(c);
                        } else {
                            Receivable r = receivableRepository.findById(id)
                                    .orElseThrow(() -> new NotFoundException("Customer or Receivable not found: " + id));
                            singleDocContent = generateCustomerBillingStatementContent(r.getCustomer());
                        }
                    }
                    default -> throw new IllegalArgumentException("Unknown document type: " + documentType);
                }

                if (count > 0) {
                    bulkContent.append("<div class=\"page-break\"></div>\n");
                }
                bulkContent.append(singleDocContent).append("\n");
                count++;
            } catch (Exception e) {
                // Ignore missing records in bulk run
            }
        }

        return baseBulkHtml("Cetak Massal " + documentType, bulkContent.toString(), count);
    }

    /** 8. Official Customer Billing Statement & Installment Ledger (G.10) */
    public String generateCustomerBillingStatementHtml(UUID customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException("Customer not found: " + customerId));
        return baseHtml("Lembar Rekening Koran Tagihan - " + customer.getFullName(),
                generateCustomerBillingStatementContent(customer));
    }

    public String generateReceivableStatementHtml(UUID receivableId) {
        Receivable receivable = receivableRepository.findById(receivableId)
                .orElseThrow(() -> new NotFoundException("Receivable obligation not found: " + receivableId));
        return baseHtml("Lembar Tagihan Angsuran - " + receivable.getReceivableNumber(),
                generateCustomerBillingStatementContent(receivable.getCustomer()));
    }

    public String generateCustomerStatementsBatchHtml(UUID storeId, List<UUID> customerIds, String status) {
        List<Customer> customers;
        if (customerIds != null && !customerIds.isEmpty()) {
            customers = customerRepository.findAllById(customerIds);
        } else {
            ReceivableStatus recStatus = null;
            if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
                try {
                    recStatus = ReceivableStatus.valueOf(status.toUpperCase());
                } catch (IllegalArgumentException ignored) {}
            }
            List<Receivable> receivables = receivableRepository.search(storeId, null, recStatus);
            customers = receivables.stream()
                    .map(Receivable::getCustomer)
                    .filter(Objects::nonNull)
                    .distinct()
                    .toList();
        }

        if (customers.isEmpty()) {
            return baseHtml("Rekening Tagihan Pelanggan (Batch)", "<p>Tidak ada data pelanggan yang memenuhi kriteria untuk dicetak.</p>");
        }

        StringBuilder bulkContent = new StringBuilder();
        int count = 0;
        for (Customer c : customers) {
            String singleDocContent = generateCustomerBillingStatementContent(c);
            if (count > 0) {
                bulkContent.append("<div class=\"page-break\"></div>\n");
            }
            bulkContent.append(singleDocContent).append("\n");
            count++;
        }

        return baseBulkHtml("Rekening Koran & Tagihan Pelanggan", bulkContent.toString(), count);
    }

    public String generateCustomerBillingStatementContent(Customer customer) {
        List<Receivable> receivables = receivableRepository.findByCustomerId(customer.getId());
        List<CustomerPayment> payments = customerPaymentRepository.findByCustomerIdOrderByPaidAtDesc(customer.getId());

        String storeName = "SMS MEBEL & ELEKTRONIK";
        String storeAddress = "Jl. Raya Industri Utama No. 88, Jawa Timur";
        String storePhone = "(031) 892-1100 / WhatsApp: 0812-3456-7890";
        if (!receivables.isEmpty() && receivables.get(0).getStore() != null) {
            var st = receivables.get(0).getStore();
            if (st.getName() != null && !st.getName().isBlank()) storeName = st.getName();
            if (st.getAddress() != null && !st.getAddress().isBlank()) storeAddress = st.getAddress();
        }

        String printDateStr = DATE_FMT.format(LocalDate.now());
        String statementNumber = "STM-" + (customer.getNik() != null && !customer.getNik().isBlank() 
                ? customer.getNik() 
                : customer.getId().toString().substring(0, 8).toUpperCase()) + "-" + LocalDate.now().toString().replace("-", "");

        BigDecimal totalFinanced = BigDecimal.ZERO;
        BigDecimal totalPaid = BigDecimal.ZERO;
        BigDecimal totalRemaining = BigDecimal.ZERO;
        BigDecimal totalOverdue = BigDecimal.ZERO;
        int totalInstallmentOverdueCount = 0;

        for (Receivable r : receivables) {
            totalFinanced = totalFinanced.add(r.getFinancedAmount() != null ? r.getFinancedAmount() : BigDecimal.ZERO);
            totalPaid = totalPaid.add(r.getTotalPaid() != null ? r.getTotalPaid() : BigDecimal.ZERO);
            totalRemaining = totalRemaining.add(r.getRemainingBalance() != null ? r.getRemainingBalance() : BigDecimal.ZERO);
            if (r.getInstallments() != null) {
                for (ReceivableInstallment inst : r.getInstallments()) {
                    if (inst.getDueDate().isBefore(LocalDate.now()) && inst.getStatus() != InstallmentStatus.PAID && inst.getStatus() != InstallmentStatus.FORGIVEN) {
                        BigDecimal due = inst.getAmountDue() != null ? inst.getAmountDue() : BigDecimal.ZERO;
                        BigDecimal paid = inst.getAmountPaid() != null ? inst.getAmountPaid() : BigDecimal.ZERO;
                        BigDecimal bal = due.subtract(paid);
                        if (bal.compareTo(BigDecimal.ZERO) > 0) {
                            totalOverdue = totalOverdue.add(bal);
                            totalInstallmentOverdueCount++;
                        }
                    }
                }
            }
        }

        String creditStatusBadge;
        if (totalOverdue.compareTo(BigDecimal.ZERO) > 0) {
            creditStatusBadge = "<span class=\"badge badge-danger\">PERHATIAN KHUSUS (" + totalInstallmentOverdueCount + " TERTUNGGAK)</span>";
        } else if (totalRemaining.compareTo(BigDecimal.ZERO) == 0 && !receivables.isEmpty()) {
            creditStatusBadge = "<span class=\"badge badge-success\">LUNAS (PAID IN FULL)</span>";
        } else if (receivables.isEmpty()) {
            creditStatusBadge = "<span class=\"badge badge-neutral\">TIDAK ADA KONTRAK AKTIF</span>";
        } else {
            creditStatusBadge = "<span class=\"badge badge-info\">LANCAR (CURRENT)</span>";
        }

        StringBuilder html = new StringBuilder();
        html.append("<div class=\"doc-boundary\">\n");

        // Header
        html.append("<div class=\"header\">\n")
            .append("  <div>\n")
            .append("    <div class=\"store-name\">").append(storeName).append("</div>\n")
            .append("    <div class=\"store-info\">").append(storeAddress).append("<br/>Telp/WA: ").append(storePhone).append("<br/><em>Sistem Manajemen Angsuran & Penjualan Ritel</em></div>\n")
            .append("  </div>\n")
            .append("  <div class=\"doc-title\">\n")
            .append("    <div class=\"doc-name\">LEMBAR REKENING KORAN TAGIHAN</div>\n")
            .append("    <div class=\"doc-number\">No: ").append(statementNumber).append("</div>\n")
            .append("    <div class=\"store-info\">Tanggal Cetak: ").append(printDateStr).append("</div>\n")
            .append("  </div>\n")
            .append("</div>\n");

        // Customer Profile Section
        html.append("<div class=\"section\">\n")
            .append("  <div class=\"section-title\">INFORMASI DEBITUR / PELANGGAN</div>\n")
            .append("  <table style=\"width: 100%; font-size: 12px; margin-bottom: 12px;\">\n")
            .append("    <tr>\n")
            .append("      <td style=\"width: 20%; font-weight: 700; color: #64748b;\">Nama Lengkap:</td>\n")
            .append("      <td style=\"width: 30%; font-weight: 700; font-size: 13px;\">").append(customer.getFullName()).append("</td>\n")
            .append("      <td style=\"width: 20%; font-weight: 700; color: #64748b;\">Segmen CRM:</td>\n")
            .append("      <td style=\"width: 30%;\">").append(customer.getSegment() != null ? customer.getSegment() : "STANDARD").append("</td>\n")
            .append("    </tr>\n")
            .append("    <tr>\n")
            .append("      <td style=\"font-weight: 700; color: #64748b;\">No. KTP / NIK:</td>\n")
            .append("      <td>").append(customer.getNik() != null ? customer.getNik() : "-").append("</td>\n")
            .append("      <td style=\"font-weight: 700; color: #64748b;\">Peringkat Kredit:</td>\n")
            .append("      <td>Grade ").append(customer.getCreditScoreGrade() != null ? customer.getCreditScoreGrade() : "B").append(" (").append(customer.getCreditScorePoints()).append(" Poin)</td>\n")
            .append("    </tr>\n")
            .append("    <tr>\n")
            .append("      <td style=\"font-weight: 700; color: #64748b;\">Nomor Telepon:</td>\n")
            .append("      <td>").append(customer.getPrimaryPhone() != null ? customer.getPrimaryPhone() : "-").append("</td>\n")
            .append("      <td style=\"font-weight: 700; color: #64748b;\">Kolektibilitas:</td>\n")
            .append("      <td>").append(creditStatusBadge).append("</td>\n")
            .append("    </tr>\n")
            .append("  </table>\n")
            .append("</div>\n");

        // Portfolio Summary Metrics
        html.append("<div class=\"metrics-grid\">\n")
            .append("  <div class=\"metric-card\">\n")
            .append("    <div class=\"metric-label\">Total Pembiayaan Pokok</div>\n")
            .append("    <div class=\"metric-value\">").append(formatRp(totalFinanced)).append("</div>\n")
            .append("  </div>\n")
            .append("  <div class=\"metric-card\">\n")
            .append("    <div class=\"metric-label\">Total Pembayaran Masuk</div>\n")
            .append("    <div class=\"metric-value\" style=\"color: #166534;\">").append(formatRp(totalPaid)).append("</div>\n")
            .append("  </div>\n")
            .append("  <div class=\"metric-card\">\n")
            .append("    <div class=\"metric-label\">Sisa Saldo Pokok</div>\n")
            .append("    <div class=\"metric-value\" style=\"color: ").append(totalRemaining.compareTo(BigDecimal.ZERO) > 0 ? "#1e3a8a" : "#64748b").append(";\">").append(formatRp(totalRemaining)).append("</div>\n")
            .append("  </div>\n")
            .append("  <div class=\"metric-card\">\n")
            .append("    <div class=\"metric-label\">Tunggakan Jatuh Tempo</div>\n")
            .append("    <div class=\"metric-value\" style=\"color: ").append(totalOverdue.compareTo(BigDecimal.ZERO) > 0 ? "#b91c1c" : "#166534").append(";\">").append(formatRp(totalOverdue)).append("</div>\n")
            .append("  </div>\n")
            .append("</div>\n");

        // Contracts & Installment Ledgers
        if (receivables.isEmpty()) {
            html.append("<div class=\"section\">\n")
                .append("  <div class=\"section-title\">BUKU ANGSURAN & KONTRAK PIUTANG</div>\n")
                .append("  <p style=\"color: #64748b; font-style: italic;\">Belum ada akun piutang / kontrak kredit terdaftar untuk pelanggan ini.</p>\n")
                .append("</div>\n");
        } else {
            for (Receivable r : receivables) {
                String soNumber = r.getSalesOrder() != null && r.getSalesOrder().getNumber() != null ? r.getSalesOrder().getNumber() : "-";
                String contractDate = r.getCreatedAt() != null 
                        ? DATE_FMT.format(r.getCreatedAt().atZone(ZoneId.systemDefault()))
                        : "-";
                
                // Get ordered products description
                StringBuilder productsDesc = new StringBuilder();
                if (r.getSalesOrder() != null && r.getSalesOrder().getId() != null) {
                    List<SalesOrderItem> items = salesOrderItemRepository.findBySalesOrderId(r.getSalesOrder().getId());
                    for (int i = 0; i < items.size(); i++) {
                        SalesOrderItem it = items.get(i);
                        if (i > 0) productsDesc.append(", ");
                        productsDesc.append(it.getProductVariant() != null ? it.getProductVariant().getVariantName() : "Unit");
                        productsDesc.append(" (").append(it.getQuantity()).append("x)");
                    }
                }
                if (productsDesc.length() == 0) productsDesc.append("Barang Financed Konsumen");

                html.append("<div class=\"section\" style=\"margin-top: 15px;\">\n")
                    .append("  <div style=\"background: #e2e8f0; padding: 6px 10px; border-radius: 4px; font-weight: 700; display: flex; justify-content: space-between; align-items: center;\">\n")
                    .append("    <span>KONTRAK: ").append(r.getReceivableNumber()).append(" (SO: ").append(soNumber).append(") - Tenor: ").append(r.getPaymentTermMonths()).append(" Bulan</span>\n")
                    .append("    <span class=\"badge badge-neutral\">").append(r.getStatus()).append("</span>\n")
                    .append("  </div>\n")
                    .append("  <div style=\"font-size: 11px; color: #475569; margin: 4px 0 8px 2px;\">\n")
                    .append("    <strong>Komoditas/Unit:</strong> ").append(productsDesc).append(" | <strong>Tgl Kontrak:</strong> ").append(contractDate).append(" | <strong>Total Nilai:</strong> ").append(formatRp(r.getTotalAmount())).append(" | <strong>DP:</strong> ").append(formatRp(r.getDownPaymentAmount())).append(" | <strong>Sisa:</strong> ").append(formatRp(r.getRemainingBalance())).append("\n")
                    .append("  </div>\n")
                    .append("  <table class=\"data-table\">\n")
                    .append("    <thead>\n")
                    .append("      <tr>\n")
                    .append("        <th class=\"text-center\" style=\"width: 35px;\">#</th>\n")
                    .append("        <th style=\"width: 100px;\">Jatuh Tempo</th>\n")
                    .append("        <th class=\"text-right\">Tagihan (Rp)</th>\n")
                    .append("        <th class=\"text-right\">Dibayar (Rp)</th>\n")
                    .append("        <th class=\"text-right\">Sisa (Rp)</th>\n")
                    .append("        <th style=\"width: 100px;\">Tgl Bayar</th>\n")
                    .append("        <th class=\"text-center\" style=\"width: 110px;\">Status</th>\n")
                    .append("        <th>Catatan / Keterangan</th>\n")
                    .append("      </tr>\n")
                    .append("    </thead>\n")
                    .append("    <tbody>\n");

                List<ReceivableInstallment> insts = r.getInstallments();
                if (insts == null || insts.isEmpty()) {
                    html.append("      <tr><td colspan=\"8\" class=\"text-center\" style=\"color: #64748b;\">Tidak ada jadwal angsuran ditemukan</td></tr>\n");
                } else {
                    for (ReceivableInstallment inst : insts) {
                        BigDecimal due = inst.getAmountDue() != null ? inst.getAmountDue() : BigDecimal.ZERO;
                        BigDecimal paid = inst.getAmountPaid() != null ? inst.getAmountPaid() : BigDecimal.ZERO;
                        BigDecimal rem = due.subtract(paid);
                        if (rem.compareTo(BigDecimal.ZERO) < 0) rem = BigDecimal.ZERO;

                        String dueDateStr = inst.getDueDate() != null ? DATE_FMT.format(inst.getDueDate()) : "-";
                        String paidDateStr = inst.getPaidAt() != null 
                                ? DATE_FMT.format(inst.getPaidAt().atZone(ZoneId.systemDefault()))
                                : "-";

                        String statusBadge;
                        String note = inst.getNotes() != null ? inst.getNotes() : "";
                        if (inst.getStatus() == InstallmentStatus.PAID) {
                            statusBadge = "<span class=\"badge badge-success\">LUNAS</span>";
                        } else if (inst.getStatus() == InstallmentStatus.PARTIAL) {
                            statusBadge = "<span class=\"badge badge-warning\">SEBAGIAN</span>";
                        } else if (inst.getDueDate().isBefore(LocalDate.now())) {
                            long days = ChronoUnit.DAYS.between(inst.getDueDate(), LocalDate.now());
                            statusBadge = "<span class=\"badge badge-danger\">TERTUNGGAK</span>";
                            if (note.isEmpty()) note = "Lewat jatuh tempo " + days + " hari";
                        } else {
                            statusBadge = "<span class=\"badge badge-info\">BELUM JATUH TEMPO</span>";
                        }

                        html.append("      <tr>\n")
                            .append("        <td class=\"text-center\" style=\"font-weight: 700;\">").append(inst.getInstallmentNumber()).append("</td>\n")
                            .append("        <td>").append(dueDateStr).append("</td>\n")
                            .append("        <td class=\"text-right\">").append(formatRp(due)).append("</td>\n")
                            .append("        <td class=\"text-right\">").append(formatRp(paid)).append("</td>\n")
                            .append("        <td class=\"text-right\" style=\"font-weight: 700; color: ").append(rem.compareTo(BigDecimal.ZERO) > 0 ? "#b91c1c" : "#166534").append(";\">").append(formatRp(rem)).append("</td>\n")
                            .append("        <td>").append(paidDateStr).append("</td>\n")
                            .append("        <td class=\"text-center\">").append(statusBadge).append("</td>\n")
                            .append("        <td style=\"font-size: 11px;\">").append(note).append("</td>\n")
                            .append("      </tr>\n");
                    }
                }

                html.append("    </tbody>\n")
                    .append("  </table>\n")
                    .append("</div>\n");
            }
        }

        // Recent Payment History Ledger
        if (payments != null && !payments.isEmpty()) {
            html.append("<div class=\"section\" style=\"margin-top: 15px;\">\n")
                .append("  <div class=\"section-title\">BUKU CATATAN PEMBAYARAN MASUK TERAKHIR</div>\n")
                .append("  <table class=\"data-table\">\n")
                .append("    <thead>\n")
                .append("      <tr>\n")
                .append("        <th style=\"width: 130px;\">No. Kuitansi</th>\n")
                .append("        <th style=\"width: 110px;\">Tanggal & Waktu</th>\n")
                .append("        <th>Metode Pembayaran</th>\n")
                .append("        <th class=\"text-right\" style=\"width: 120px;\">Nominal Diterima</th>\n")
                .append("        <th>Petugas Penerima</th>\n")
                .append("        <th>Keterangan</th>\n")
                .append("      </tr>\n")
                .append("    </thead>\n")
                .append("    <tbody>\n");

            int paymentLimit = Math.min(payments.size(), 10);
            for (int i = 0; i < paymentLimit; i++) {
                CustomerPayment p = payments.get(i);
                String payDate = p.getPaidAt() != null 
                        ? DATE_FMT.format(p.getPaidAt().atZone(ZoneId.systemDefault()))
                        : "-";
                String collectorName = p.getCollectedBy() != null ? p.getCollectedBy().getFullName() : "Kasir Showroom";
                
                html.append("      <tr>\n")
                    .append("        <td style=\"font-weight: 700;\">").append(p.getPaymentNumber()).append("</td>\n")
                    .append("        <td>").append(payDate).append("</td>\n")
                    .append("        <td>").append(p.getPaymentMethod()).append(" (").append(p.getPaymentType()).append(")</td>\n")
                    .append("        <td class=\"text-right\" style=\"font-weight: 700; color: #166534;\">").append(formatRp(p.getAmount())).append("</td>\n")
                    .append("        <td>").append(collectorName).append("</td>\n")
                    .append("        <td style=\"font-size: 11px;\">").append(p.getNotes() != null ? p.getNotes() : "-").append("</td>\n")
                    .append("      </tr>\n");
            }

            html.append("    </tbody>\n")
                .append("  </table>\n")
                .append("</div>\n");
        }

        // Legal & Money Management Disclaimer
        html.append("<div class=\"notice-box\">\n")
            .append("  <strong>PEMBERITAHUAN MANAJEMEN ANGSURAN & PEMBAYARAN KONSUMEN:</strong><br/>\n")
            .append("  1. Dokumen ini adalah lembar rekening koran dan tagihan angsuran internal sistem manajemen keuangan ritel (bukan rekening perbankan komersial).<br/>\n")
            .append("  2. Pembayaran resmi hanya sah apabila disetorkan ke meja kasir showroom resmi atau diterima oleh kolektor lapangan resmi dengan bukti kuitansi sistem bernomor valid.<br/>\n")
            .append("  3. Simpan seluruh lembar bukti pembayaran Anda sebagai bukti sah pelunasan kewajiban angsuran pembiayaan barang.\n")
            .append("</div>\n");

        // Signatures
        html.append("<div class=\"signatures\">\n")
            .append("  <div class=\"sig-box\">\n")
            .append("    <div>Bagian Finance & Admin Piutang</div>\n")
            .append("    <div class=\"sig-line\">( Staf Finance )</div>\n")
            .append("  </div>\n")
            .append("  <div class=\"sig-box\">\n")
            .append("    <div>Mengetahui, Kepala Toko</div>\n")
            .append("    <div class=\"sig-line\">( Branch Manager )</div>\n")
            .append("  </div>\n")
            .append("  <div class=\"sig-box\">\n")
            .append("    <div>Diterima & Diakui Debitur</div>\n")
            .append("    <div class=\"sig-line\">( ").append(customer.getFullName()).append(" )</div>\n")
            .append("  </div>\n")
            .append("</div>\n");

        html.append("</div>\n");
        return html.toString();
    }
}
