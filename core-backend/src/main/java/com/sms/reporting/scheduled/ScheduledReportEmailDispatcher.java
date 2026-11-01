package com.sms.reporting.scheduled;

import com.sms.foundation.employee.Employee;
import com.sms.foundation.employee.EmployeeRoleRepository;
import com.sms.foundation.employee.EmploymentStatus;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import com.sms.reporting.ReportingService;
import com.sms.reporting.dto.CollectionAgingSummaryResponse;
import com.sms.reporting.dto.InventoryDistributionResponse;
import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduledReportEmailDispatcher {

    private final EmployeeRoleRepository employeeRoleRepository;
    private final StoreRepository storeRepository;
    private final ReportingService reportingService;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${sms.reports.mail.from:reports@smsmart.co.id}")
    private String mailFromAddress;

    @Value("${sms.reports.mail.enabled:false}")
    private boolean mailDeliveryEnabled;

    @Getter
    @Builder
    public static class DispatchResult {
        private final int recipientsCount;
        private final List<String> recipientEmails;
        private final List<String> attachmentNames;
        private final boolean mailSent;
    }

    public static class ReportAttachment {
        public final String filename;
        public final byte[] data;
        public final String contentType;

        public ReportAttachment(String filename, byte[] data, String contentType) {
            this.filename = filename;
            this.data = data;
            this.contentType = contentType;
        }
    }

    /**
     * Resolves all store manager and target role email addresses for a store/company-wide scope.
     */
    public List<String> resolveRecipientEmails(UUID storeId, String targetRole, String customRecipientEmails) {
        String role = (targetRole != null && !targetRole.isBlank()) ? targetRole.trim().toUpperCase() : "MANAGER";
        Set<String> emailSet = new LinkedHashSet<>();

        List<Employee> employees;
        if (storeId != null) {
            employees = employeeRoleRepository.findEmployeesByRoleCodeAndStoreId(role, storeId, EmploymentStatus.ACTIVE);
        } else {
            employees = employeeRoleRepository.findEmployeesByRoleCode(role, EmploymentStatus.ACTIVE);
        }

        for (Employee emp : employees) {
            if (emp.getEmail() != null && !emp.getEmail().isBlank()) {
                emailSet.add(emp.getEmail().trim().toLowerCase());
            }
        }

        // Add custom recipient emails (comma or semicolon separated)
        if (customRecipientEmails != null && !customRecipientEmails.isBlank()) {
            String[] parts = customRecipientEmails.split("[,;\\s]+");
            for (String p : parts) {
                if (p.contains("@") && p.contains(".")) {
                    emailSet.add(p.trim().toLowerCase());
                }
            }
        }

        return new ArrayList<>(emailSet);
    }

    /**
     * Resolves employee names for recipient preview.
     */
    public List<String> resolveRecipientNames(UUID storeId, String targetRole) {
        String role = (targetRole != null && !targetRole.isBlank()) ? targetRole.trim().toUpperCase() : "MANAGER";
        List<Employee> employees;
        if (storeId != null) {
            employees = employeeRoleRepository.findEmployeesByRoleCodeAndStoreId(role, storeId, EmploymentStatus.ACTIVE);
        } else {
            employees = employeeRoleRepository.findEmployeesByRoleCode(role, EmploymentStatus.ACTIVE);
        }

        List<String> names = new ArrayList<>();
        for (Employee emp : employees) {
            if (emp.getFullName() != null && !emp.getFullName().isBlank()) {
                names.add(emp.getFullName() + (emp.getEmail() != null ? " (" + emp.getEmail() + ")" : ""));
            }
        }
        return names;
    }

    /**
     * Dispatches scheduled email digest to store managers with Excel (.xlsx) attachments.
     */
    public DispatchResult dispatchDigest(
            ScheduledReportConfig config,
            List<ReportAttachment> attachments
    ) {
        UUID storeId = config.getStore() != null ? config.getStore().getId() : null;
        String storeScope = resolveStoreName(storeId);
        String todayStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));

        List<String> recipients = resolveRecipientEmails(storeId, config.getTargetRole(), config.getCustomRecipientEmails());

        if (recipients.isEmpty()) {
            log.warn("[SCHEDULED REPORT] No recipient email addresses resolved for config '{}' (store: {}, role: {}). Adding fallback admin notify.",
                    config.getName(), storeScope, config.getTargetRole());
            recipients = List.of("admin@smsmart.co.id");
        }

        List<String> attachmentNames = attachments.stream().map(a -> a.filename).toList();
        String subject = String.format("[SMS Digest] %s — %s (%s)", config.getName(), todayStr, storeScope);
        String htmlBody = buildDigestHtmlBody(config, storeScope, todayStr);

        boolean actualSent = false;
        if (mailSender != null && mailDeliveryEnabled) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
                helper.setFrom(mailFromAddress);
                helper.setTo(recipients.toArray(new String[0]));
                helper.setSubject(subject);
                helper.setText(htmlBody, true);

                for (ReportAttachment att : attachments) {
                    helper.addAttachment(att.filename, new ByteArrayResource(att.data), att.contentType);
                }

                mailSender.send(message);
                actualSent = true;
                log.info("[SCHEDULED REPORT EMAIL] Successfully sent email digest '{}' to {} recipients ({}) via SMTP",
                        subject, recipients.size(), recipients);
            } catch (Exception ex) {
                log.error("[SCHEDULED REPORT EMAIL] Failed to deliver via JavaMailSender, logging payload: {}", ex.getMessage(), ex);
            }
        } else {
            log.info("[SCHEDULED REPORT SIMULATED] SMTP disabled or unconfigured. Simulated dispatch for '{}' | Recipients ({}): {} | Attachments: {}",
                    subject, recipients.size(), recipients, attachmentNames);
            actualSent = true; // Recorded as successful simulated dispatch in dev/test environment
        }

        return DispatchResult.builder()
                .recipientsCount(recipients.size())
                .recipientEmails(recipients)
                .attachmentNames(attachmentNames)
                .mailSent(actualSent)
                .build();
    }

    private String buildDigestHtmlBody(ScheduledReportConfig config, String storeScope, String todayStr) {
        UUID storeId = config.getStore() != null ? config.getStore().getId() : null;
        CollectionAgingSummaryResponse aging = reportingService.getCollectionAging(storeId);
        InventoryDistributionResponse inv = reportingService.getInventoryDistribution(storeId);

        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html><body style=\"font-family: Arial, sans-serif; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px;\">");
        sb.append("<div style=\"max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;\">");

        // Header
        sb.append("<div style=\"background: #1e3a8a; padding: 24px; color: #ffffff;\">");
        sb.append("<h2 style=\"margin: 0; font-size: 20px; font-weight: bold;\">Store Management System — Automated Digest</h2>");
        sb.append("<p style=\"margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;\">").append(config.getName()).append(" • ").append(todayStr).append("</p>");
        sb.append("<p style=\"margin: 4px 0 0 0; font-size: 13px; opacity: 0.8;\">Scope: <strong>").append(storeScope).append("</strong></p>");
        sb.append("</div>");

        // Body Content
        sb.append("<div style=\"padding: 24px;\">");
        sb.append("<p style=\"font-size: 14px; line-height: 1.6;\">Dear Store Operations Team,</p>");
        sb.append("<p style=\"font-size: 14px; line-height: 1.6;\">Below is your automated operational summary. Comprehensive multi-sheet Excel (.xlsx) workbooks are attached with full unit serial numbers and customer contract balances.</p>");

        // Financial KPIs Card
        if (config.getReportType() == ReportType.FINANCIAL_AGING || config.getReportType() == ReportType.ALL_COMBINED) {
            sb.append("<div style=\"margin: 20px 0; padding: 16px; background: #f1f5f9; border-radius: 6px; border-left: 4px solid #2563eb;\">");
            sb.append("<h3 style=\"margin: 0 0 12px 0; font-size: 15px; color: #1e293b;\">Financial Receivables & Delinquency Aging</h3>");
            sb.append("<table style=\"width: 100%; border-collapse: collapse; font-size: 13px;\">");
            sb.append("<tr><td style=\"padding: 4px 0;\">Active Receivables Portfolio:</td><td style=\"font-weight: bold; text-align: right;\">IDR ").append(formatNumber(aging != null ? aging.getTotalReceivableBalance() : BigDecimal.ZERO)).append("</td></tr>");
            sb.append("<tr><td style=\"padding: 4px 0;\">Total Overdue Installments:</td><td style=\"font-weight: bold; color: #dc2626; text-align: right;\">IDR ").append(formatNumber(aging != null ? aging.getTotalOverdueBalance() : BigDecimal.ZERO)).append("</td></tr>");
            sb.append("<tr><td style=\"padding: 4px 0;\">Cash Collections:</td><td style=\"font-weight: bold; color: #16a34a; text-align: right;\">IDR ").append(formatNumber(aging != null ? aging.getTotalCollectedCash() : BigDecimal.ZERO)).append("</td></tr>");
            sb.append("<tr><td style=\"padding: 4px 0;\">Custody Discrepancies Flagged:</td><td style=\"font-weight: bold; text-align: right;\">").append(aging != null ? aging.getCustodyDiscrepanciesCount() : 0).append("</td></tr>");
            sb.append("</table></div>");
        }

        // Stock Balance KPIs Card
        if (config.getReportType() == ReportType.STOCK_BALANCE || config.getReportType() == ReportType.ALL_COMBINED) {
            sb.append("<div style=\"margin: 20px 0; padding: 16px; background: #f1f5f9; border-radius: 6px; border-left: 4px solid #0891b2;\">");
            sb.append("<h3 style=\"margin: 0 0 12px 0; font-size: 15px; color: #1e293b;\">Stock Balance & Inventory Distribution</h3>");
            sb.append("<table style=\"width: 100%; border-collapse: collapse; font-size: 13px;\">");
            sb.append("<tr><td style=\"padding: 4px 0;\">Total Ingested Units:</td><td style=\"font-weight: bold; text-align: right;\">").append(inv != null ? inv.getTotalUnits() : 0).append(" units</td></tr>");
            sb.append("<tr><td style=\"padding: 4px 0;\">Available for Sale:</td><td style=\"font-weight: bold; color: #16a34a; text-align: right;\">").append(inv != null ? inv.getAvailableUnits() : 0).append(" units</td></tr>");
            sb.append("<tr><td style=\"padding: 4px 0;\">Showroom Floor Display:</td><td style=\"font-weight: bold; text-align: right;\">").append(inv != null ? inv.getShowroomUnits() : 0).append(" units</td></tr>");
            sb.append("<tr><td style=\"padding: 4px 0;\">Warehouse Storage:</td><td style=\"font-weight: bold; text-align: right;\">").append(inv != null ? inv.getWarehouseUnits() : 0).append(" units</td></tr>");
            sb.append("<tr><td style=\"padding: 4px 0;\">Reserved (Pending Delivery):</td><td style=\"font-weight: bold; color: #d97706; text-align: right;\">").append(inv != null ? inv.getReservedUnits() : 0).append(" units</td></tr>");
            sb.append("</table></div>");
        }

        // Action note & Footer
        sb.append("<div style=\"margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;\">");
        sb.append("<p style=\"margin: 0;\">Confidential: This automated email digest is intended solely for store operational managers. Do not forward externally.</p>");
        sb.append("<p style=\"margin: 4px 0 0 0;\">Store Management System (SMS) • Automated Reporting Daemon</p>");
        sb.append("</div></div></div></body></html>");

        return sb.toString();
    }

    private String resolveStoreName(UUID storeId) {
        if (storeId == null) {
            return "Company Wide (All Stores)";
        }
        return storeRepository.findById(storeId).map(Store::getName).orElse("Store Branch (" + storeId + ")");
    }

    private String formatNumber(java.math.BigDecimal amount) {
        if (amount == null) return "0";
        return String.format("%,.0f", amount.doubleValue());
    }
}
