package com.sms.reporting.scheduled;

import com.sms.finance.Receivable;
import com.sms.finance.ReceivableRepository;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import com.sms.inventory.StockUnit;
import com.sms.inventory.StockUnitRepository;
import com.sms.reporting.ReportingService;
import com.sms.reporting.dto.CollectionAgingBucket;
import com.sms.reporting.dto.CollectionAgingSummaryResponse;
import com.sms.reporting.dto.InventoryDistributionResponse;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExcelReportGeneratorService {

    private final ReportingService reportingService;
    private final ReceivableRepository receivableRepository;
    private final StockUnitRepository stockUnitRepository;
    private final StoreRepository storeRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * Generates a multi-sheet Financial Aging & Delinquency Excel workbook (.xlsx).
     * Sheet 1: Aging Summary (Delinquency buckets, risk distribution, portfolio KPIs)
     * Sheet 2: Receivable Accounts Ledger (Itemized customer accounts)
     */
    public byte[] generateFinancialAgingExcel(UUID storeId) {
        String storeScope = resolveStoreName(storeId);
        String asOf = LocalDate.now().format(DATE_FMT);

        CollectionAgingSummaryResponse agingSummary = reportingService.getCollectionAging(storeId);
        List<Receivable> receivables = receivableRepository.search(storeId, null, null);

        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            CellStyle titleStyle = createTitleStyle(wb);
            CellStyle subtitleStyle = createSubtitleStyle(wb);
            CellStyle headerStyle = createHeaderStyle(wb);
            CellStyle metaLabelStyle = createMetaLabelStyle(wb);
            CellStyle metaValueStyle = createMetaValueStyle(wb);
            CellStyle currencyStyle = createCurrencyStyle(wb);
            CellStyle borderStyle = createBorderedStyle(wb);

            // ==========================================
            // SHEET 1: Aging Summary
            // ==========================================
            Sheet sheet1 = wb.createSheet("Aging Summary");

            int r = 0;
            Row rTitle = sheet1.createRow(r++);
            Cell cTitle = rTitle.createCell(0);
            cTitle.setCellValue("STORE MANAGEMENT SYSTEM — CREDIT AGING PORTFOLIO");
            cTitle.setCellStyle(titleStyle);

            Row rSub = sheet1.createRow(r++);
            Cell cSub = rSub.createCell(0);
            cSub.setCellValue("Delinquency risk breakdown and portfolio health as of " + asOf);
            cSub.setCellStyle(subtitleStyle);

            r++; // blank row

            // Metadata block
            r = appendMetaRow(sheet1, r, "Report Name", "Credit Receivables Portfolio & Aging Analysis", metaLabelStyle, metaValueStyle);
            r = appendMetaRow(sheet1, r, "Generated As Of", asOf, metaLabelStyle, metaValueStyle);
            r = appendMetaRow(sheet1, r, "Store Scope", storeScope, metaLabelStyle, metaValueStyle);
            r = appendMetaRow(sheet1, r, "Total Active Portfolio (IDR)", formatAmount(agingSummary != null ? agingSummary.getTotalReceivableBalance() : BigDecimal.ZERO), metaLabelStyle, metaValueStyle);
            r = appendMetaRow(sheet1, r, "Total Overdue Balance (IDR)", formatAmount(agingSummary != null ? agingSummary.getTotalOverdueBalance() : BigDecimal.ZERO), metaLabelStyle, metaValueStyle);
            r = appendMetaRow(sheet1, r, "Total Collected Cash (IDR)", formatAmount(agingSummary != null ? agingSummary.getTotalCollectedCash() : BigDecimal.ZERO), metaLabelStyle, metaValueStyle);
            r = appendMetaRow(sheet1, r, "Cash Custody Discrepancies Flagged", String.valueOf(agingSummary != null ? agingSummary.getCustodyDiscrepanciesCount() : 0), metaLabelStyle, metaValueStyle);

            r++; // blank row

            // Delinquency Table
            Row tblHeader = sheet1.createRow(r++);
            String[] bucketHeaders = {"Aging Delinquency Bucket", "Installment Count", "Outstanding Balance (IDR)", "Portfolio Share (%)"};
            for (int i = 0; i < bucketHeaders.length; i++) {
                Cell ch = tblHeader.createCell(i);
                ch.setCellValue(bucketHeaders[i]);
                ch.setCellStyle(headerStyle);
            }

            if (agingSummary != null && agingSummary.getBuckets() != null) {
                for (CollectionAgingBucket b : agingSummary.getBuckets()) {
                    Row row = sheet1.createRow(r++);
                    Cell c0 = row.createCell(0);
                    c0.setCellValue(b.getBucketName());
                    c0.setCellStyle(borderStyle);

                    Cell c1 = row.createCell(1);
                    c1.setCellValue(b.getInstallmentCount());
                    c1.setCellStyle(borderStyle);

                    Cell c2 = row.createCell(2);
                    c2.setCellValue(b.getTotalAmount() != null ? b.getTotalAmount().doubleValue() : 0.0);
                    c2.setCellStyle(currencyStyle);

                    Cell c3 = row.createCell(3);
                    c3.setCellValue(String.format("%.1f%%", b.getPercentage()));
                    c3.setCellStyle(borderStyle);
                }
            }

            for (int i = 0; i < bucketHeaders.length; i++) {
                sheet1.autoSizeColumn(i);
                sheet1.setColumnWidth(i, Math.max(sheet1.getColumnWidth(i) + 1200, 4500));
            }

            // ==========================================
            // SHEET 2: Receivable Accounts Ledger
            // ==========================================
            Sheet sheet2 = wb.createSheet("Receivable Accounts");
            int r2 = 0;
            Row r2Title = sheet2.createRow(r2++);
            Cell c2Title = r2Title.createCell(0);
            c2Title.setCellValue("STORE MANAGEMENT SYSTEM — RECEIVABLE ACCOUNTS LEDGER");
            c2Title.setCellStyle(titleStyle);

            Row r2Sub = sheet2.createRow(r2++);
            Cell c2Sub = r2Sub.createCell(0);
            c2Sub.setCellValue("Itemized customer contract balances and statuses");
            c2Sub.setCellStyle(subtitleStyle);

            r2++; // blank

            Row r2Hdr = sheet2.createRow(r2++);
            String[] recHeaders = {
                    "Contract Number", "Customer Name", "Contact Phone", "Store Branch",
                    "Financed Principal (IDR)", "Total Paid (IDR)", "Remaining Balance (IDR)",
                    "Term (Months)", "Contract Status", "First Due Date"
            };
            for (int i = 0; i < recHeaders.length; i++) {
                Cell ch = r2Hdr.createCell(i);
                ch.setCellValue(recHeaders[i]);
                ch.setCellStyle(headerStyle);
            }

            for (Receivable rec : receivables) {
                Row row = sheet2.createRow(r2++);
                createStringCell(row, 0, rec.getReceivableNumber(), borderStyle);
                createStringCell(row, 1, rec.getCustomer() != null ? rec.getCustomer().getFullName() : "-", borderStyle);
                createStringCell(row, 2, rec.getCustomer() != null ? rec.getCustomer().getPrimaryPhone() : "-", borderStyle);
                createStringCell(row, 3, rec.getStore() != null ? rec.getStore().getName() : "-", borderStyle);

                createNumericCell(row, 4, rec.getFinancedAmount(), currencyStyle);
                createNumericCell(row, 5, rec.getTotalPaid(), currencyStyle);
                createNumericCell(row, 6, rec.getRemainingBalance(), currencyStyle);

                Cell cTerm = row.createCell(7);
                cTerm.setCellValue(rec.getPaymentTermMonths());
                cTerm.setCellStyle(borderStyle);

                createStringCell(row, 8, rec.getStatus() != null ? rec.getStatus().name() : "-", borderStyle);
                createStringCell(row, 9, rec.getFirstDueDate() != null ? rec.getFirstDueDate().format(DATE_FMT) : "-", borderStyle);
            }

            for (int i = 0; i < recHeaders.length; i++) {
                sheet2.autoSizeColumn(i);
                sheet2.setColumnWidth(i, Math.max(sheet2.getColumnWidth(i) + 1200, 4200));
            }

            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Failed to generate Financial Aging Excel workbook", e);
            throw new RuntimeException("Excel generation error: " + e.getMessage(), e);
        }
    }

    /**
     * Generates a multi-sheet Stock Balance & Inventory Distribution Excel workbook (.xlsx).
     * Sheet 1: Inventory Summary (Location breakdown & availability KPIs)
     * Sheet 2: Stock Units Ledger (Individual serialized units, locations, status)
     */
    public byte[] generateStockBalanceExcel(UUID storeId) {
        String storeScope = resolveStoreName(storeId);
        String asOf = LocalDate.now().format(DATE_FMT);

        InventoryDistributionResponse inv = reportingService.getInventoryDistribution(storeId);
        List<StockUnit> units = stockUnitRepository.search(storeId, null, null);

        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            CellStyle titleStyle = createTitleStyle(wb);
            CellStyle subtitleStyle = createSubtitleStyle(wb);
            CellStyle headerStyle = createHeaderStyle(wb);
            CellStyle metaLabelStyle = createMetaLabelStyle(wb);
            CellStyle metaValueStyle = createMetaValueStyle(wb);
            CellStyle borderStyle = createBorderedStyle(wb);

            // ==========================================
            // SHEET 1: Inventory Summary
            // ==========================================
            Sheet sheet1 = wb.createSheet("Inventory Summary");
            int r = 0;
            Row rTitle = sheet1.createRow(r++);
            Cell cTitle = rTitle.createCell(0);
            cTitle.setCellValue("STORE MANAGEMENT SYSTEM — STOCK BALANCE & DISTRIBUTION");
            cTitle.setCellStyle(titleStyle);

            Row rSub = sheet1.createRow(r++);
            Cell cSub = rSub.createCell(0);
            cSub.setCellValue("Physical inventory breakdown across warehouse, showroom, and transit as of " + asOf);
            cSub.setCellStyle(subtitleStyle);

            r++; // blank

            long totalUnits = inv != null ? inv.getTotalUnits() : 0;
            long availableUnits = inv != null ? inv.getAvailableUnits() : 0;
            long reservedUnits = inv != null ? inv.getReservedUnits() : 0;
            long unavailableUnits = inv != null ? inv.getUnavailableUnits() : 0;

            r = appendMetaRow(sheet1, r, "Report Name", "Inventory Distribution & Stock Balance Report", metaLabelStyle, metaValueStyle);
            r = appendMetaRow(sheet1, r, "Generated As Of", asOf, metaLabelStyle, metaValueStyle);
            r = appendMetaRow(sheet1, r, "Store Scope", storeScope, metaLabelStyle, metaValueStyle);
            r = appendMetaRow(sheet1, r, "Total Ingested Units", String.valueOf(totalUnits), metaLabelStyle, metaValueStyle);
            r = appendMetaRow(sheet1, r, "Units Available for Sale", String.valueOf(availableUnits), metaLabelStyle, metaValueStyle);
            r = appendMetaRow(sheet1, r, "Units Reserved (Pending Order)", String.valueOf(reservedUnits), metaLabelStyle, metaValueStyle);
            r = appendMetaRow(sheet1, r, "Units Unavailable (Quarantined/Disposed)", String.valueOf(unavailableUnits), metaLabelStyle, metaValueStyle);

            r++; // blank

            Row tblHdr = sheet1.createRow(r++);
            String[] locHeaders = {"Physical Location", "Unit Count", "% of Inventory"};
            for (int i = 0; i < locHeaders.length; i++) {
                Cell ch = tblHdr.createCell(i);
                ch.setCellValue(locHeaders[i]);
                ch.setCellStyle(headerStyle);
            }

            long total = totalUnits > 0 ? totalUnits : 1;
            Object[][] locations = {
                    {"Warehouse Storage", inv != null ? inv.getWarehouseUnits() : 0L},
                    {"Showroom Display", inv != null ? inv.getShowroomUnits() : 0L},
                    {"Repair & Service Area", inv != null ? inv.getRepairAreaUnits() : 0L},
                    {"In-Transit (Fleet/Transfer)", inv != null ? inv.getInTransitUnits() : 0L},
                    {"At Customer (Delivered/Installment)", inv != null ? inv.getAtCustomerUnits() : 0L}
            };

            for (Object[] rowData : locations) {
                Row row = sheet1.createRow(r++);
                String locName = (String) rowData[0];
                long count = (long) rowData[1];
                double pct = ((double) count / total) * 100.0;

                Cell c0 = row.createCell(0);
                c0.setCellValue(locName);
                c0.setCellStyle(borderStyle);

                Cell c1 = row.createCell(1);
                c1.setCellValue(count);
                c1.setCellStyle(borderStyle);

                Cell c2 = row.createCell(2);
                c2.setCellValue(String.format("%.1f%%", pct));
                c2.setCellStyle(borderStyle);
            }

            for (int i = 0; i < locHeaders.length; i++) {
                sheet1.autoSizeColumn(i);
                sheet1.setColumnWidth(i, Math.max(sheet1.getColumnWidth(i) + 1200, 4800));
            }

            // ==========================================
            // SHEET 2: Stock Units Ledger
            // ==========================================
            Sheet sheet2 = wb.createSheet("Stock Units Ledger");
            int r2 = 0;
            Row r2Title = sheet2.createRow(r2++);
            Cell c2Title = r2Title.createCell(0);
            c2Title.setCellValue("STORE MANAGEMENT SYSTEM — SERIALIZED STOCK UNITS");
            c2Title.setCellStyle(titleStyle);

            Row r2Sub = sheet2.createRow(r2++);
            Cell c2Sub = r2Sub.createCell(0);
            c2Sub.setCellValue("Individual unit serialized ledger records and physical condition");
            c2Sub.setCellStyle(subtitleStyle);

            r2++; // blank

            Row r2Hdr = sheet2.createRow(r2++);
            String[] unitHeaders = {"Serial Number", "Product Variant", "Physical Location", "Availability Status", "Condition / Notes"};
            for (int i = 0; i < unitHeaders.length; i++) {
                Cell ch = r2Hdr.createCell(i);
                ch.setCellValue(unitHeaders[i]);
                ch.setCellStyle(headerStyle);
            }

            for (StockUnit u : units) {
                Row row = sheet2.createRow(r2++);
                createStringCell(row, 0, u.getManufacturerSerial() != null ? u.getManufacturerSerial() : "Non-serialized", borderStyle);
                createStringCell(row, 1, u.getProductVariant() != null ? u.getProductVariant().getVariantName() : "-", borderStyle);
                createStringCell(row, 2, u.getLocationType() != null ? u.getLocationType().name() : "-", borderStyle);
                createStringCell(row, 3, u.getAvailabilityStatus() != null ? u.getAvailabilityStatus().name() : "-", borderStyle);
                createStringCell(row, 4, u.getNotes() != null ? u.getNotes() : "-", borderStyle);
            }

            for (int i = 0; i < unitHeaders.length; i++) {
                sheet2.autoSizeColumn(i);
                sheet2.setColumnWidth(i, Math.max(sheet2.getColumnWidth(i) + 1200, 4800));
            }

            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Failed to generate Stock Balance Excel workbook", e);
            throw new RuntimeException("Excel generation error: " + e.getMessage(), e);
        }
    }

    private String resolveStoreName(UUID storeId) {
        if (storeId == null) {
            return "Company Wide (All Stores)";
        }
        return storeRepository.findById(storeId)
                .map(Store::getName)
                .orElse("Store Branch (" + storeId + ")");
    }

    private String formatAmount(BigDecimal amount) {
        if (amount == null) return "0";
        return String.format("%,.0f", amount.doubleValue());
    }

    private int appendMetaRow(Sheet sheet, int rowIdx, String label, String value, CellStyle lblStyle, CellStyle valStyle) {
        Row row = sheet.createRow(rowIdx);
        Cell c0 = row.createCell(0);
        c0.setCellValue(label);
        c0.setCellStyle(lblStyle);

        Cell c1 = row.createCell(1);
        c1.setCellValue(value);
        c1.setCellStyle(valStyle);
        return rowIdx + 1;
    }

    private void createStringCell(Row row, int colIdx, String text, CellStyle style) {
        Cell cell = row.createCell(colIdx);
        cell.setCellValue(text != null ? text : "");
        cell.setCellStyle(style);
    }

    private void createNumericCell(Row row, int colIdx, BigDecimal amount, CellStyle style) {
        Cell cell = row.createCell(colIdx);
        cell.setCellValue(amount != null ? amount.doubleValue() : 0.0);
        cell.setCellStyle(style);
    }

    private CellStyle createTitleStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 14);
        font.setColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFont(font);
        return style;
    }

    private CellStyle createSubtitleStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setItalic(true);
        font.setFontHeightInPoints((short) 10);
        font.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
        style.setFont(font);
        return style;
    }

    private CellStyle createHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        applyBorders(style);
        return style;
    }

    private CellStyle createMetaLabelStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        style.setFont(font);
        applyBorders(style);
        return style;
    }

    private CellStyle createMetaValueStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        applyBorders(style);
        return style;
    }

    private CellStyle createBorderedStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        applyBorders(style);
        return style;
    }

    private CellStyle createCurrencyStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        style.setDataFormat(wb.createDataFormat().getFormat("#,##0"));
        applyBorders(style);
        return style;
    }

    private void applyBorders(CellStyle style) {
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
    }
}
