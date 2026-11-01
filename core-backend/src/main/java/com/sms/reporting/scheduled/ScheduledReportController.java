package com.sms.reporting.scheduled;

import com.sms.reporting.scheduled.dto.RecipientPreviewResponse;
import com.sms.reporting.scheduled.dto.ScheduledReportConfigRequest;
import com.sms.reporting.scheduled.dto.ScheduledReportConfigResponse;
import com.sms.reporting.scheduled.dto.ScheduledReportLogResponse;
import com.sms.reporting.scheduled.dto.TriggerDispatchResponse;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reporting")
@RequiredArgsConstructor
public class ScheduledReportController {

    private final ScheduledReportService scheduledReportService;
    private final ExcelReportGeneratorService excelReportGeneratorService;

    private static final String XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    @GetMapping("/scheduled/configs")
    @PreAuthorize("hasAuthority('REPORTING_VIEW') or hasRole('OWNER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<ScheduledReportConfigResponse>> listConfigs(
            @RequestParam(name = "storeId", required = false) UUID storeId) {
        return ResponseEntity.ok(scheduledReportService.listConfigs(storeId));
    }

    @GetMapping("/scheduled/configs/{id}")
    @PreAuthorize("hasAuthority('REPORTING_VIEW') or hasRole('OWNER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ScheduledReportConfigResponse> getConfig(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(scheduledReportService.getConfig(id));
    }

    @PostMapping("/scheduled/configs")
    @PreAuthorize("hasAuthority('REPORTING_MANAGE') or hasRole('OWNER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ScheduledReportConfigResponse> createConfig(
            @Valid @RequestBody ScheduledReportConfigRequest req) {
        return ResponseEntity.ok(scheduledReportService.createConfig(req));
    }

    @PutMapping("/scheduled/configs/{id}")
    @PreAuthorize("hasAuthority('REPORTING_MANAGE') or hasRole('OWNER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ScheduledReportConfigResponse> updateConfig(
            @PathVariable("id") UUID id,
            @Valid @RequestBody ScheduledReportConfigRequest req) {
        return ResponseEntity.ok(scheduledReportService.updateConfig(id, req));
    }

    @DeleteMapping("/scheduled/configs/{id}")
    @PreAuthorize("hasAuthority('REPORTING_MANAGE') or hasRole('OWNER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteConfig(@PathVariable("id") UUID id) {
        scheduledReportService.deleteConfig(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/scheduled/configs/{id}/trigger")
    @PreAuthorize("hasAuthority('REPORTING_MANAGE') or hasRole('OWNER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<TriggerDispatchResponse> triggerConfig(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(scheduledReportService.triggerReport(id));
    }

    @GetMapping("/scheduled/logs")
    @PreAuthorize("hasAuthority('REPORTING_VIEW') or hasRole('OWNER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<ScheduledReportLogResponse>> listLogs(
            @RequestParam(name = "configId", required = false) UUID configId,
            @RequestParam(name = "limit", defaultValue = "30") int limit) {
        return ResponseEntity.ok(scheduledReportService.listLogs(configId, limit));
    }

    @GetMapping("/scheduled/preview-recipients")
    @PreAuthorize("hasAuthority('REPORTING_VIEW') or hasRole('OWNER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<RecipientPreviewResponse> previewRecipients(
            @RequestParam(name = "storeId", required = false) UUID storeId,
            @RequestParam(name = "targetRole", defaultValue = "MANAGER") String targetRole,
            @RequestParam(name = "customRecipientEmails", required = false) String customRecipientEmails) {
        return ResponseEntity.ok(scheduledReportService.previewRecipients(storeId, targetRole, customRecipientEmails));
    }

    @GetMapping("/export/financial-aging.xlsx")
    @PreAuthorize("hasAuthority('REPORTING_VIEW') or hasRole('OWNER') or hasRole('MANAGER') or hasRole('ADMIN') or hasRole('AR')")
    public ResponseEntity<byte[]> exportFinancialAgingExcel(
            @RequestParam(name = "storeId", required = false) UUID storeId) {
        byte[] bytes = excelReportGeneratorService.generateFinancialAgingExcel(storeId);
        String dateSuffix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"financial_aging_report_" + dateSuffix + ".xlsx\"")
                .contentType(MediaType.parseMediaType(XLSX_MIME))
                .body(bytes);
    }

    @GetMapping("/export/stock-balance.xlsx")
    @PreAuthorize("hasAuthority('REPORTING_VIEW') or hasRole('OWNER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportStockBalanceExcel(
            @RequestParam(name = "storeId", required = false) UUID storeId) {
        byte[] bytes = excelReportGeneratorService.generateStockBalanceExcel(storeId);
        String dateSuffix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"stock_balance_report_" + dateSuffix + ".xlsx\"")
                .contentType(MediaType.parseMediaType(XLSX_MIME))
                .body(bytes);
    }
}
