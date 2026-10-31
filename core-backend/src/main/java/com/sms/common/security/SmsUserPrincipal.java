package com.sms.common.security;

import java.util.Set;
import java.util.UUID;

/**
 * Authenticated backend principal resolved from the Supabase JWT `sub` claim.
 * Roles and store scope drive method-security and data-scope filtering.
 */
public record SmsUserPrincipal(
        UUID employeeId,
        UUID authUserId,
        Set<String> roles,
        Set<UUID> storeIds) {

    public boolean hasRole(String role) {
        return roles.contains(role);
    }

    public boolean hasStore(UUID storeId) {
        return storeIds.contains(storeId);
    }
}
