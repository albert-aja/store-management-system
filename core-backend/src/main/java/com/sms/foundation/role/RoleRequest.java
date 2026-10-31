package com.sms.foundation.role;

import jakarta.validation.constraints.NotBlank;

public record RoleRequest(@NotBlank String code, @NotBlank String name, String description) {
}
