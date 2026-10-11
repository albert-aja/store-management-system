package com.sms.foundation.employee;

import java.util.List;
import java.util.UUID;

public record MeResponse(
        UUID employeeId,
        String fullName,
        List<String> roleCodes,
        List<String> permissionCodes,
        List<UUID> storeIds) {
}
