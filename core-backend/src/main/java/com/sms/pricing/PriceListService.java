package com.sms.pricing;

import com.sms.common.web.NotFoundException;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import com.sms.pricing.dto.CalculatedTermItem;
import com.sms.pricing.dto.PriceListGroupDto;
import com.sms.pricing.dto.PriceListItemDto;
import com.sms.pricing.dto.PriceListReportResponse;
import com.sms.product.dto.Product;
import com.sms.product.dto.ProductVariant;
import com.sms.product.repository.ProductVariantRepository;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PriceListService {

    private final StoreRepository storeRepository;
    private final StoreProductPriceRepository priceRepository;
    private final StoreProductPaymentPlanRepository planRepository;
    private final ProductVariantRepository variantRepository;
    private final PriceCalculationService calculationService;

    private static final Locale ID_LOCALE = Locale.of("id", "ID");
    public static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMMM yyyy", ID_LOCALE);

    public PriceListReportResponse getPriceListReport(UUID storeId, String groupBy) {
        return getPriceListReport(storeId, groupBy, null);
    }

    public PriceListReportResponse getPriceListReport(UUID storeId, String groupBy, LocalDate validFrom) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new NotFoundException("Store not found: " + storeId));

        LocalDate effectiveDate = validFrom != null ? validFrom : LocalDate.now();

        List<StoreProductPrice> prices = priceRepository.findByStoreId(storeId);
        List<ProductVariant> allVariants = variantRepository.findAll();

        Map<UUID, StoreProductPrice> priceMap = new HashMap<>();
        for (StoreProductPrice p : prices) {
            priceMap.put(p.getProductVariant().getId(), p);
        }

        // Map to store grouped items
        Map<String, List<PriceListItemDto>> groupedMap = new LinkedHashMap<>();

        // Sort variants by product category/brand then name
        List<ProductVariant> sortedVariants = allVariants.stream()
                .filter(ProductVariant::isActive)
                .sorted(Comparator.comparing((ProductVariant v) -> {
                    if ("brand".equalsIgnoreCase(groupBy)) {
                        return v.getProduct().getBrand() != null ? v.getProduct().getBrand().getName() : "Lain-lain";
                    } else {
                        return v.getProduct().getCategory() != null ? v.getProduct().getCategory().getName() : "Umum";
                    }
                }).thenComparing(v -> v.getProduct().getName())
                  .thenComparing(ProductVariant::getVariantName))
                .toList();

        for (ProductVariant v : sortedVariants) {
            Product p = v.getProduct();
            if (p == null || !p.isActive()) continue;

            String groupKey;
            if ("brand".equalsIgnoreCase(groupBy)) {
                groupKey = p.getBrand() != null ? p.getBrand().getName().toUpperCase() : "PRODUK LAINNYA";
            } else {
                groupKey = p.getCategory() != null ? p.getCategory().getName().toUpperCase() : "PRODUK UMUM";
            }

            StoreProductPrice spp = priceMap.get(v.getId());
            BigDecimal cashPrice = spp != null ? spp.getCashPrice() : BigDecimal.ZERO;
            BigDecimal hd = (spp != null && spp.getBasePrice() != null)
                    ? spp.getBasePrice()
                    : (cashPrice.compareTo(BigDecimal.ZERO) > 0 ? cashPrice : BigDecimal.ZERO);

            BigDecimal dp = (spp != null && spp.getDownPayment() != null && spp.getDownPayment().compareTo(BigDecimal.ZERO) > 0)
                    ? spp.getDownPayment()
                    : calculationService.getSuggestedDp(hd);

            // Fetch configured payment plans or calculate dynamically via formula
            BigDecimal inst10 = BigDecimal.ZERO;
            BigDecimal inst12 = BigDecimal.ZERO;
            BigDecimal inst15 = BigDecimal.ZERO;

            if (spp != null) {
                List<StoreProductPaymentPlan> plans = planRepository.findByStoreProductPriceIdOrderByTermMonths(spp.getId());
                for (StoreProductPaymentPlan plan : plans) {
                    if (plan.getTermMonths() == 10) {
                        inst10 = plan.getMonthlyInstallment() != null
                                ? plan.getMonthlyInstallment()
                                : plan.getTotalPrice().divide(BigDecimal.valueOf(10), 0, java.math.RoundingMode.HALF_UP);
                    } else if (plan.getTermMonths() == 12) {
                        inst12 = plan.getMonthlyInstallment() != null
                                ? plan.getMonthlyInstallment()
                                : plan.getTotalPrice().divide(BigDecimal.valueOf(12), 0, java.math.RoundingMode.HALF_UP);
                    } else if (plan.getTermMonths() == 15) {
                        inst15 = plan.getMonthlyInstallment() != null
                                ? plan.getMonthlyInstallment()
                                : plan.getTotalPrice().divide(BigDecimal.valueOf(15), 0, java.math.RoundingMode.HALF_UP);
                    }
                }
            }

            // Fallback to calculation formula if plan is not explicitly configured
            if (hd.compareTo(BigDecimal.ZERO) > 0) {
                if (inst10.compareTo(BigDecimal.ZERO) == 0) {
                    inst10 = calculationService.calculateInstallment(hd, dp, 10).monthlyInstallment();
                }
                if (inst12.compareTo(BigDecimal.ZERO) == 0) {
                    inst12 = calculationService.calculateInstallment(hd, dp, 12).monthlyInstallment();
                }
                if (inst15.compareTo(BigDecimal.ZERO) == 0) {
                    inst15 = calculationService.calculateInstallment(hd, dp, 15).monthlyInstallment();
                }
            }

            PriceListItemDto itemDto = PriceListItemDto.builder()
                    .variantId(v.getId())
                    .sku(v.getSku())
                    .productName(p.getName())
                    .variantName(v.getVariantName())
                    .displayName(p.getName().equalsIgnoreCase(v.getVariantName()) ? p.getName() : p.getName() + " " + v.getVariantName())
                    .categoryName(p.getCategory() != null ? p.getCategory().getName() : "")
                    .brandName(p.getBrand() != null ? p.getBrand().getName() : "")
                    .specifications(p.getDescription() != null ? p.getDescription() : "")
                    .cashPrice(cashPrice)
                    .hargaDasar(hd)
                    .downPayment(dp)
                    .installment10(inst10)
                    .installment12(inst12)
                    .installment15(inst15)
                    .build();

            groupedMap.computeIfAbsent(groupKey, k -> new ArrayList<>()).add(itemDto);
        }

        List<PriceListGroupDto> groupDtos = new ArrayList<>();
        groupedMap.forEach((name, items) -> groupDtos.add(new PriceListGroupDto(name, items)));

        return PriceListReportResponse.builder()
                .storeId(store.getId())
                .storeName(store.getName())
                .effectiveDate(effectiveDate)
                .groups(groupDtos)
                .build();
    }

    public String generatePriceListHtml(UUID storeId, String groupBy) {
        return generatePriceListHtml(storeId, groupBy, null);
    }

    /**
     * Generates a clean, ready-to-print HTML document matching the official retail price list layout.
     * Includes "Berlaku mulai tanggal: [DD MMMM YYYY]" at the bottom of each group section / page.
     */
    public String generatePriceListHtml(UUID storeId, String groupBy, LocalDate validFrom) {
        PriceListReportResponse report = getPriceListReport(storeId, groupBy, validFrom);
        String effectiveDateStr = DATE_FMT.format(report.effectiveDate());

        DecimalFormatSymbols symbols = new DecimalFormatSymbols(ID_LOCALE);
        symbols.setGroupingSeparator('.');
        symbols.setDecimalSeparator(',');
        DecimalFormat thousandsFmt = new DecimalFormat("#,##0", symbols);

        StringBuilder tablesHtml = new StringBuilder();

        for (PriceListGroupDto group : report.groups()) {
            StringBuilder rows = new StringBuilder();
            int idx = 1;

            for (PriceListItemDto item : group.items()) {
                String hdStr = formatRibuan(item.hargaDasar(), thousandsFmt);
                String dpStr = item.downPayment() != null && item.downPayment().compareTo(BigDecimal.ZERO) > 0
                        ? formatRibuan(item.downPayment(), thousandsFmt)
                        : "-";
                String inst10Str = formatRibuan(item.installment10(), thousandsFmt);
                String inst12Str = formatRibuan(item.installment12(), thousandsFmt);
                String inst15Str = formatRibuan(item.installment15(), thousandsFmt);

                String specOrCode = item.sku();
                if (item.specifications() != null && !item.specifications().isBlank()) {
                    specOrCode += " • " + item.specifications();
                }

                rows.append("<tr>")
                        .append("<td class=\"text-center\">").append(idx++).append("</td>")
                        .append("<td><strong>").append(escapeHtml(item.displayName())).append("</strong></td>")
                        .append("<td class=\"text-center\">").append(escapeHtml(specOrCode)).append("</td>")
                        .append("<td class=\"text-right font-mono\">").append(hdStr).append("</td>")
                        .append("<td class=\"text-right font-mono\">").append(dpStr).append("</td>")
                        .append("<td class=\"text-right font-mono font-bold\">").append(inst10Str).append("</td>")
                        .append("<td class=\"text-right font-mono font-bold\">").append(inst12Str).append("</td>")
                        .append("<td class=\"text-right font-mono font-bold\">").append(inst15Str).append("</td>")
                        .append("</tr>\n");
            }

            tablesHtml.append("<div class=\"group-section\">\n")
                    .append("  <div class=\"group-title\">").append(escapeHtml(group.groupName())).append("</div>\n")
                    .append("  <table class=\"price-table\">\n")
                    .append("    <thead>\n")
                    .append("      <tr>\n")
                    .append("        <th rowspan=\"2\" style=\"width: 35px;\" class=\"text-center\">NO</th>\n")
                    .append("        <th rowspan=\"2\">JENIS & MERK / NAMA BARANG</th>\n")
                    .append("        <th rowspan=\"2\" style=\"width: 140px;\" class=\"text-center\">KODE / SPECS</th>\n")
                    .append("        <th rowspan=\"2\" style=\"width: 80px;\" class=\"text-right\">HD</th>\n")
                    .append("        <th rowspan=\"2\" style=\"width: 75px;\" class=\"text-right\">DP</th>\n")
                    .append("        <th colspan=\"3\" class=\"text-center\">ANGSURAN BULANAN</th>\n")
                    .append("      </tr>\n")
                    .append("      <tr>\n")
                    .append("        <th style=\"width: 75px;\" class=\"text-right\">10 BLN</th>\n")
                    .append("        <th style=\"width: 75px;\" class=\"text-right\">12 BLN</th>\n")
                    .append("        <th style=\"width: 75px;\" class=\"text-right\">15 BLN</th>\n")
                    .append("      </tr>\n")
                    .append("    </thead>\n")
                    .append("    <tbody>\n")
                    .append(rows)
                    .append("    </tbody>\n")
                    .append("  </table>\n")
                    .append("  <div class=\"section-footer-valid-date\">Berlaku mulai tanggal ").append(effectiveDateStr).append("</div>\n")
                    .append("</div>\n");
        }

        return "<!DOCTYPE html>\n" +
                "<html lang=\"id\">\n" +
                "<head>\n" +
                "  <meta charset=\"UTF-8\" />\n" +
                "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n" +
                "  <title>Daftar Harga - " + escapeHtml(report.storeName()) + "</title>\n" +
                "  <style>\n" +
                "    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 15px auto; max-width: 960px; color: #000; font-size: 11px; line-height: 1.4; }\n" +
                "    .print-bar { background: #0f172a; color: #fff; padding: 10px 16px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }\n" +
                "    .print-btn { background: #10b981; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 13px; }\n" +
                "    .print-btn:hover { background: #059669; }\n" +
                "    .main-header { text-align: center; margin-bottom: 22px; }\n" +
                "    .store-label { font-size: 14px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 1px; }\n" +
                "    .doc-headline { font-size: 20px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; margin: 4px 0 2px 0; }\n" +
                "    .effective-badge { font-size: 11px; font-style: italic; color: #334155; font-weight: 600; }\n" +
                "    .unit-note { font-size: 10px; color: #64748b; margin-top: 2px; }\n" +
                "    .group-section { margin-bottom: 30px; page-break-inside: avoid; }\n" +
                "    .group-title { font-size: 13px; font-weight: 800; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 0; border-top: 2px solid #000; border-bottom: 2px solid #000; margin-bottom: 4px; background: #f8fafc; }\n" +
                "    table.price-table { width: 100%; border-collapse: collapse; font-size: 10.5px; }\n" +
                "    table.price-table th, table.price-table td { border: 1px solid #334155; padding: 4px 6px; }\n" +
                "    table.price-table th { background-color: #f1f5f9; font-weight: 800; color: #0f172a; }\n" +
                "    .text-center { text-align: center; }\n" +
                "    .text-right { text-align: right; }\n" +
                "    .font-mono { font-family: 'Consolas', 'Courier New', monospace; }\n" +
                "    .font-bold { font-weight: 700; }\n" +
                "    .section-footer-valid-date { text-align: right; font-size: 10.5px; font-style: italic; font-weight: 700; margin-top: 6px; color: #0f172a; }\n" +
                "    .footer-note { margin-top: 30px; font-size: 10px; color: #475569; border-top: 1px dashed #94a3b8; padding-top: 8px; display: flex; justify-content: space-between; }\n" +
                "    @media print {\n" +
                "      .no-print { display: none !important; }\n" +
                "      body { margin: 0; padding: 5mm; font-size: 10pt; }\n" +
                "      .group-section { page-break-inside: avoid; margin-bottom: 25px; }\n" +
                "      table.price-table th, table.price-table td { border-color: #000; }\n" +
                "      .section-footer-valid-date { font-size: 9pt; font-weight: bold; }\n" +
                "    }\n" +
                "  </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "  <div class=\"print-bar no-print\">\n" +
                "    <span><strong>Daftar Harga Resmi:</strong> " + escapeHtml(report.storeName()) + " (Berlaku " + effectiveDateStr + ")</span>\n" +
                "    <button class=\"print-btn\" onclick=\"window.print()\">Cetak PDF / Print</button>\n" +
                "  </div>\n" +
                "  <div class=\"main-header\">\n" +
                "    <div class=\"store-label\">" + escapeHtml(report.storeName()) + " • RETAIL ELEKTRONIK & FURNITUR</div>\n" +
                "    <div class=\"doc-headline\">DAFTAR HARGA & SKEMA ANGSURAN RESMI</div>\n" +
                "    <div class=\"effective-badge\">Berlaku mulai tanggal: " + effectiveDateStr + "</div>\n" +
                "    <div class=\"unit-note\">* Seluruh nilai nominal dicantumkan dalam ribuan rupiah (x Rp 1.000)</div>\n" +
                "  </div>\n" +
                tablesHtml +
                "  <div class=\"footer-note\">\n" +
                "    <div>Dokumen harga resmi operasional toko. Perubahan harga otomatis tercatat pada log sistem.</div>\n" +
                "    <div>Dicetak pada: " + effectiveDateStr + "</div>\n" +
                "  </div>\n" +
                "</body>\n" +
                "</html>";
    }

    private String formatRibuan(BigDecimal val, DecimalFormat fmt) {
        if (val == null || val.compareTo(BigDecimal.ZERO) <= 0) return "-";
        BigDecimal ribuan = val.compareTo(BigDecimal.valueOf(10_000)) >= 0
                ? val.divide(BigDecimal.valueOf(1000), 0, java.math.RoundingMode.HALF_UP)
                : val;
        return fmt.format(ribuan);
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
