package com.sms.common.audit;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SecurityAuditLogService {

    private final SecurityAuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public SecurityAuditLog logEvent(
            String eventType,
            UUID actorId,
            String actorName,
            UUID storeId,
            String referenceType,
            UUID referenceId,
            String severity,
            String description,
            String metadata
    ) {
        SecurityAuditLog entry = new SecurityAuditLog();
        entry.setEventType(eventType);
        entry.setActorId(actorId);
        entry.setActorName(actorName);
        entry.setStoreId(storeId);
        entry.setReferenceType(referenceType);
        entry.setReferenceId(referenceId);
        entry.setSeverity(severity != null ? severity : "INFO");
        entry.setDescription(description);
        entry.setMetadata(metadata);

        log.info("[AUDIT] [{}] [{}] Actor: {} - {}", severity, eventType, actorName, description);
        return auditLogRepository.save(entry);
    }

    public void logPriceOverride(UUID orderId, UUID storeId, BigDecimal oldPrice, BigDecimal newPrice, UUID approverId, String approverName, String reason) {
        String desc = String.format("Price override on SO #%s: %s -> %s. Reason: %s", orderId, oldPrice, newPrice, reason);
        logEvent("PRICE_OVERRIDE", approverId, approverName, storeId, "SALES_ORDER", orderId, "WARN", desc, null);
    }

    public void logCashDiscrepancy(UUID custodyId, UUID storeId, BigDecimal expected, BigDecimal declared, UUID cashierId, String cashierName, String notes) {
        String desc = String.format("Cash custody discrepancy on custody #%s: Expected %s vs Declared %s. Notes: %s", custodyId, expected, declared, notes);
        logEvent("CASH_DISCREPANCY", cashierId, cashierName, storeId, "PAYMENT_CUSTODY", custodyId, "ERROR", desc, null);
    }

    public void logStockScrap(UUID stockUnitId, UUID storeId, String serialNumber, UUID authorizerId, String authorizerName, String reason) {
        String desc = String.format("Permanent scrap disposal for Stock Unit SN: %s. Reason: %s", serialNumber, reason);
        logEvent("STOCK_SCRAP_WRITE_OFF", authorizerId, authorizerName, storeId, "STOCK_UNIT", stockUnitId, "WARN", desc, null);
    }

    public void logCreditDecision(UUID surveyId, UUID storeId, boolean approved, UUID surveyorId, String surveyorName, String notes) {
        String desc = String.format("Credit survey decision: %s. Notes: %s", approved ? "APPROVED" : "REJECTED", notes);
        logEvent("CREDIT_DECISION", surveyorId, surveyorName, storeId, "SURVEY", surveyId, approved ? "INFO" : "WARN", desc, null);
    }

    @Transactional(readOnly = true)
    public List<SecurityAuditLog> searchLogs(UUID storeId, String eventType) {
        return auditLogRepository.search(storeId, eventType);
    }
}

