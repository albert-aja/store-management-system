package com.sms.foundation.role;

import java.util.UUID;

public record RoleResponse(UUID id, String code, String name, String description) {

    public static RoleResponse from(Role role) {
        return new RoleResponse(role.getId(), role.getCode(), role.getName(), role.getDescription());
    }
}
