package com.sms.reporting.scheduled;

import com.sms.common.web.BusinessRuleException;
import com.sms.common.web.NotFoundException;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import com.sms.reporting.scheduled.ScheduledReportEmailDispatcher.ReportAttachment;
import com.sms.reporting.scheduled.dto.RecipientPreviewResponse;
import com.sms.reporting.scheduled.dto.ScheduledReportConfigRequest;
import com.sms.reporting.scheduled.dto.ScheduledReportConfigResponse;
import com.sms.reporting.scheduled.dto.ScheduledReportLogResponse;
import com.sms.reporting.scheduled.dto.TriggerDispatchResponse;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduledReportService {

    private final ScheduledReportConfigRepository configRepository;
    private final ScheduledReportLogRepository logRepository;
    private final StoreRepository storeRepository;
    private final ExcelReportGeneratorService excelReportGeneratorService;
    private final ScheduledReportEmailDispatcher emailDispatcher;

    private static final String XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    @Transactional(readOnly = true)
    public List<ScheduledReportConfigResponse> listConfigs(UUID storeId) {
        return configRepository.search(storeId).stream()
                .map(ScheduledReportConfigResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ScheduledReportConfigResponse getConfig(UUID id) {
        return ScheduledReportConfigResponse.from(findConfigOrThrow(id));
    }

    @Transactional
    public ScheduledReportConfigResponse createConfig(ScheduledReportConfigRequest req) {
        ScheduledReportConfig config = new ScheduledReportConfig();
        applyRequest(config, req);
        ScheduledReportConfig saved = configRepository.save(config);
        log.info("Created scheduled report configuration: {} ({})", saved.getName(), saved.getReportType());
        return ScheduledReportConfigResponse.from(saved);
    }

    @Transactional
    public ScheduledReportConfigResponse updateConfig(UUID id, ScheduledReportConfigRequest req) {
        ScheduledReportConfig config = findConfigOrThrow(id);
        applyRequest(config, req);
        ScheduledReportConfig saved = configRepository.save(config);
        log.info("Updated scheduled report configuration: {} ({})", saved.getName(), saved.getId());
        return ScheduledReportConfigResponse.from(saved);
    }

    @Transactional
    public void deleteConfig(UUID id) {
        ScheduledReportConfig config = findConfigOrThrow(id);
        configRepository.delete(config);
        log.info("Deleted scheduled report configuration: {}", id);
    }

    @Transactional(readOnly = true)
    public List<ScheduledReportLogResponse> listLogs(UUID configId, int limit) {
        int pageSize = Math.max(1, Math.min(limit, 100));
        return logRepository.search(configId, PageRequest.of(0, pageSize)).stream()
                .map(ScheduledReportLogResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public RecipientPreviewResponse previewRecipients(UUID storeId, String targetRole, String customRecipientEmails) {
        String role = (targetRole != null && !targetRole.isBlank()) ? targetRole.trim().toUpperCase() : "MANAGER";
        String storeName = "Company Wide (All Stores)";
        if (storeId != null) {
            storeName = storeRepository.findById(storeId).map(Store::getName).orElse("Branch (" + storeId + ")");
        }

        List<String> emails = emailDispatcher.resolveRecipientEmails(storeId, role, customRecipientEmails);
        List<String> names = emailDispatcher.resolveRecipientNames(storeId, role);

        return new RecipientPreviewResponse(
                emails.size(),
                storeId,
                storeName,
                role,
                emails,
                names
        );
    }

    /**
     * Executes report generation and email digest dispatch on-demand or by scheduler.
     */
    @Transactional
    public TriggerDispatchResponse triggerReport(UUID configId) {
        ScheduledReportConfig config = findConfigOrThrow(configId);
        long startTime = System.currentTimeMillis();
        UUID storeId = config.getStore() != null ? config.getStore().getId() : null;
        String dateSuffix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        List<ReportAttachment> attachments = new ArrayList<>();
        List<String> attachmentNames = new ArrayList<>();

        try {
            // Generate Financial Aging Excel workbook if requested
            if (config.getReportType() == ReportType.FINANCIAL_AGING || config.getReportType() == ReportType.ALL_COMBINED) {
                byte[] agingBytes = excelReportGeneratorService.generateFinancialAgingExcel(storeId);
                String filename = "financial_aging_report_" + dateSuffix + ".xlsx";
                attachments.add(new ReportAttachment(filename, agingBytes, XLSX_MIME));
                attachmentNames.add(filename);
            }

            // Generate Stock Balance Excel workbook if requested
            if (config.getReportType() == ReportType.STOCK_BALANCE || config.getReportType() == ReportType.ALL_COMBINED) {
                byte[] stockBytes = excelReportGeneratorService.generateStockBalanceExcel(storeId);
                String filename = "stock_balance_report_" + dateSuffix + ".xlsx";
                attachments.add(new ReportAttachment(filename, stockBytes, XLSX_MIME));
                attachmentNames.add(filename);
            }

            // Dispatch Email Digest
            ScheduledReportEmailDispatcher.DispatchResult dispatch = emailDispatcher.dispatchDigest(config, attachments);
            long duration = System.currentTimeMillis() - startTime;

            // Audit Log
            ScheduledReportLog runLog = new ScheduledReportLog();
            runLog.setConfig(config);
            runLog.setExecutedAt(Instant.now());
            runLog.setReportType(config.getReportType());
            runLog.setStatus(ExecutionStatus.SUCCESS);
            runLog.setRecipientsCount(dispatch.getRecipientsCount());
            runLog.setRecipientEmails(String.join(", ", dispatch.getRecipientEmails()));
            runLog.setAttachmentsGenerated(String.join(", ", attachmentNames));
            runLog.setDurationMs(duration);
            logRepository.save(runLog);

            // Update Config execution state
            config.setLastRunAt(Instant.now());
            config.setLastStatus(ExecutionStatus.SUCCESS);
            config.setLastErrorMessage(null);
            configRepository.save(config);

            log.info("Dispatched report digest '{}' to {} recipients in {} ms",
                    config.getName(), dispatch.getRecipientsCount(), duration);

            return new TriggerDispatchResponse(
                    true,
                    "Digest successfully dispatched to " + dispatch.getRecipientsCount() + " manager recipient(s)",
                    runLog.getId(),
                    dispatch.getRecipientsCount(),
                    dispatch.getRecipientEmails(),
                    attachmentNames,
                    duration
            );
        } catch (Exception ex) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("Failed to execute scheduled report '{}': {}", config.getName(), ex.getMessage(), ex);

            ScheduledReportLog failLog = new ScheduledReportLog();
            failLog.setConfig(config);
            failLog.setExecutedAt(Instant.now());
            failLog.setReportType(config.getReportType());
            failLog.setStatus(ExecutionStatus.FAILED);
            failLog.setDurationMs(duration);
            failLog.setErrorMessage(ex.getMessage());
            logRepository.save(failLog);

            config.setLastRunAt(Instant.now());
            config.setLastStatus(ExecutionStatus.FAILED);
            config.setLastErrorMessage(ex.getMessage());
            configRepository.save(config);

            throw new BusinessRuleException("Report dispatch failed: " + ex.getMessage());
        }
    }

    /**
     * Automated recurring background scheduler running hourly to dispatch due digests.
     */
    @Scheduled(cron = "${sms.reports.scheduler.cron:0 0 * * * *}")
    public void runDueScheduledReports() {
        log.debug("Evaluating scheduled report configurations for automated execution...");
        List<ScheduledReportConfig> activeConfigs = configRepository.findByEnabledTrue();
        LocalDate today = LocalDate.now();
        DayOfWeek todayDow = today.getDayOfWeek();

        for (ScheduledReportConfig cfg : activeConfigs) {
            if (isDue(cfg, today, todayDow)) {
                log.info("Scheduled report '{}' ({}) is due for dispatch. Executing...", cfg.getName(), cfg.getId());
                try {
                    triggerReport(cfg.getId());
                } catch (Exception e) {
                    log.error("Automated execution failed for scheduled report '{}': {}", cfg.getName(), e.getMessage());
                }
            }
        }
    }

    private boolean isDue(ScheduledReportConfig cfg, LocalDate today, DayOfWeek todayDow) {
        if (!cfg.isEnabled()) {
            return false;
        }

        // If ran today already, do not run twice in the same day
        if (cfg.getLastRunAt() != null) {
            LocalDate lastRunDate = cfg.getLastRunAt().atZone(ZoneId.systemDefault()).toLocalDate();
            if (lastRunDate.isEqual(today)) {
                return false;
            }
        }

        if (cfg.getFrequency() == ScheduleFrequency.DAILY) {
            return true;
        }

        if (cfg.getFrequency() == ScheduleFrequency.WEEKLY) {
            if (cfg.getDayOfWeek() == null || cfg.getDayOfWeek().isBlank()) {
                return todayDow == DayOfWeek.MONDAY;
            }
            return todayDow.name().equalsIgnoreCase(cfg.getDayOfWeek().trim());
        }

        return false;
    }

    private ScheduledReportConfig findConfigOrThrow(UUID id) {
        return configRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Scheduled report configuration not found with id: " + id));
    }

    private void applyRequest(ScheduledReportConfig config, ScheduledReportConfigRequest req) {
        config.setName(req.name().trim());
        config.setReportType(req.reportType());
        config.setFrequency(req.frequency());
        config.setDayOfWeek(req.dayOfWeek() != null && !req.dayOfWeek().isBlank() ? req.dayOfWeek().trim().toUpperCase() : null);
        config.setDispatchTime(req.dispatchTime() != null && !req.dispatchTime().isBlank() ? req.dispatchTime().trim() : "08:00");

        if (req.storeId() != null) {
            Store store = storeRepository.findById(req.storeId())
                    .orElseThrow(() -> new NotFoundException("Store not found with id: " + req.storeId()));
            config.setStore(store);
        } else {
            config.setStore(null);
        }

        config.setTargetRole(req.targetRole() != null && !req.targetRole().isBlank() ? req.targetRole().trim().toUpperCase() : "MANAGER");
        config.setCustomRecipientEmails(req.customRecipientEmails() != null ? req.customRecipientEmails().trim() : null);
        config.setEnabled(req.enabled() == null || req.enabled());
    }
}
