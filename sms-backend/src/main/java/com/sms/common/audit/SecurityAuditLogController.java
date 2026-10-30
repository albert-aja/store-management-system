package com.sms.common.audit;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('OWNER') or hasRole('MANAGER') or hasRole('ADMIN')")
public class SecurityAuditLogController {

    private final SecurityAuditLogService auditLogService;

    @GetMapping
    public List<SecurityAuditLog> searchLogs(
            @RequestParam(required = false) UUID storeId,
            @RequestParam(required = false) String eventType) {
        return auditLogService.searchLogs(storeId, eventType);
    }
}

