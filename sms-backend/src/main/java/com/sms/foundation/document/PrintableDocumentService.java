package com.sms.foundation.document;

import com.sms.common.web.NotFoundException;
import com.sms.customer.Customer;
import com.sms.customer.CustomerAddress;
import com.sms.delivery.DeliveryItem;
import com.sms.delivery.DeliveryOrder;
import com.sms.delivery.DeliveryOrderRepository;
import com.sms.finance.CustomerPayment;
import com.sms.finance.CustomerPaymentRepository;
import com.sms.finance.PaymentAllocation;
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
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
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

    /** 1. Official Surat Jalan (Delivery Order) */
    public String generateSuratJalanHtml(UUID deliveryOrderId) {
        DeliveryOrder order = deliveryOrderRepository.findById(deliveryOrderId)
                .orElseThrow(() -> new NotFoundException("Delivery Order not found: " + deliveryOrderId));
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

        String content = "<div class=\"header\">\n" +
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
                "</div>";

        return baseHtml("Surat Jalan " + order.getDeliveryOrderNumber(), content);
    }

    /** 2. Official Credit Sales Order Agreement Contract */
    public String generateCreditAgreementHtml(UUID salesOrderId) {
        SalesOrder so = salesOrderRepository.findById(salesOrderId)
                .orElseThrow(() -> new NotFoundException("Sales Order not found: " + salesOrderId));
        Customer c = so.getCustomer();
        List<SalesOrderItem> items = salesOrderItemRepository.findBySalesOrderId(salesOrderId);
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

        String content = "<div class=\"header\">\n" +
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
                "</div>";

        return baseHtml("Perjanjian Kredit " + so.getNumber(), content);
    }

    /** 3. Official Customer Payment Receipt (Kuitansi Pembayaran) */
    public String generatePaymentReceiptHtml(UUID paymentId) {
        CustomerPayment payment = customerPaymentRepository.findById(paymentId)
                .orElseThrow(() -> new NotFoundException("Payment not found: " + paymentId));
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

        String content = "<div class=\"header\">\n" +
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
                "</div>";

        return baseHtml("Kuitansi " + payment.getPaymentNumber(), content);
    }

    /** 4. Official Employee Monthly Payroll Slip */
    public String generatePayrollSlipHtml(UUID slipId) {
        PayrollSlip slip = payrollSlipRepository.findById(slipId)
                .orElseThrow(() -> new NotFoundException("Payroll Slip not found: " + slipId));
        String empName = slip.getEmployee().getFullName();
        String periodName = slip.getPayrollPeriod().getName();
        String dateRange = DATE_FMT.format(slip.getPayrollPeriod().getStartDate()) + " s/d " + DATE_FMT.format(slip.getPayrollPeriod().getEndDate());

        String content = "<div class=\"header\">\n" +
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
                "</div>";

        return baseHtml("Slip Gaji " + empName, content);
    }

    /** 5. Formal Repossession Notice & Handover Letter */
    public String generateRepossessionNoticeHtml(UUID returnId) {
        StockReturn sr = stockReturnRepository.findById(returnId)
                .orElseThrow(() -> new NotFoundException("Return/Repossession record not found: " + returnId));
        String storeName = sr.getStore() != null ? sr.getStore().getName() : "Pusat Jaya Store";
        String dateStr = sr.getScheduledDate() != null
                ? DATE_FMT.format(sr.getScheduledDate())
                : DATE_FMT.format(java.time.LocalDate.now());

        String content = "<div class=\"header\">\n" +
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
                "</div>";

        return baseHtml("Berita Acara Penarikan " + sr.getReturnNumber(), content);
    }
}

