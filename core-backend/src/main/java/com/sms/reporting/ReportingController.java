package com.sms.reporting;

import com.sms.reporting.dto.CollectionAgingSummaryResponse;
import com.sms.reporting.dto.ExecutiveOverviewResponse;
import com.sms.reporting.dto.InventoryDistributionResponse;
import com.sms.reporting.dto.OperationalExceptionItem;
import com.sms.reporting.dto.PeriodComparisonResponse;
import com.sms.reporting.dto.SalesPerformanceItem;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reporting")
@RequiredArgsConstructor
public class ReportingController {

    private final ReportingService reportingService;

    @GetMapping("/overview")
    @PreAuthorize("hasAuthority('REPORTING_VIEW') or hasRole('OWNER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ExecutiveOverviewResponse> getExecutiveOverview(
            @RequestParam(name = "storeId", required = false) UUID storeId) {
        return ResponseEntity.ok(reportingService.getExecutiveOverview(storeId));
    }

    @GetMapping("/sales-performance")
    @PreAuthorize("hasAuthority('REPORTING_VIEW') or hasRole('OWNER') or hasRole('MANAGER') or hasRole('ADMIN') or hasRole('SPV')")
    public ResponseEntity<List<SalesPerformanceItem>> getSalesPerformance(
            @RequestParam(name = "storeId", required = false) UUID storeId,
            @RequestParam(name = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(name = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(reportingService.getSalesPerformance(storeId, startDate, endDate));
    }

    @GetMapping("/collection-aging")
    @PreAuthorize("hasAuthority('REPORTING_VIEW') or hasRole('OWNER') or hasRole('MANAGER') or hasRole('ADMIN') or hasRole('AR')")
    public ResponseEntity<CollectionAgingSummaryResponse> getCollectionAging(
            @RequestParam(name = "storeId", required = false) UUID storeId) {
        return ResponseEntity.ok(reportingService.getCollectionAging(storeId));
    }

    @GetMapping("/period-comparison")
    @PreAuthorize("hasAuthority('REPORTING_VIEW') or hasRole('OWNER') or hasRole('MANAGER') or hasRole('ADMIN') or hasRole('AR')")
    public ResponseEntity<PeriodComparisonResponse> getPeriodComparison(
            @RequestParam(name = "storeId", required = false) UUID storeId,
            @RequestParam(name = "primaryStart", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate primaryStart,
            @RequestParam(name = "primaryEnd", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate primaryEnd,
            @RequestParam(name = "compareStart", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate compareStart,
            @RequestParam(name = "compareEnd", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate compareEnd) {
        return ResponseEntity.ok(reportingService.getPeriodComparison(storeId, primaryStart, primaryEnd, compareStart, compareEnd));
    }

    @GetMapping("/inventory-distribution")
    @PreAuthorize("hasAuthority('REPORTING_VIEW') or hasRole('OWNER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<InventoryDistributionResponse> getInventoryDistribution(
            @RequestParam(name = "storeId", required = false) UUID storeId) {
        return ResponseEntity.ok(reportingService.getInventoryDistribution(storeId));
    }

    @GetMapping("/exceptions")
    @PreAuthorize("hasAuthority('REPORTING_VIEW') or hasRole('OWNER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<OperationalExceptionItem>> getOperationalExceptions(
            @RequestParam(name = "storeId", required = false) UUID storeId) {
        return ResponseEntity.ok(reportingService.getOperationalExceptions(storeId));
    }

    @GetMapping("/export/receivables-aging")
    @PreAuthorize("hasAuthority('REPORTING_VIEW') or hasRole('OWNER') or hasRole('MANAGER') or hasRole('ADMIN') or hasRole('AR')")
    public ResponseEntity<String> exportReceivablesReport(
            @RequestParam(name = "storeId", required = false) UUID storeId) {
        String csv = reportingService.generateReceivablesReportCsv(storeId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"receivables-aging.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
    }

    @GetMapping("/export/sales-summary")
    @PreAuthorize("hasAuthority('REPORTING_VIEW') or hasRole('OWNER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<String> exportSalesReport(
            @RequestParam(name = "storeId", required = false) UUID storeId,
            @RequestParam(name = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(name = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        String csv = reportingService.generateSalesReportCsv(storeId, startDate, endDate);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"sales-summary.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
    }
}
