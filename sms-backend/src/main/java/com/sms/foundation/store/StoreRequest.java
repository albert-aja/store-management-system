package com.sms.foundation.store;

import jakarta.validation.constraints.NotBlank;

public record StoreRequest(@NotBlank String code, @NotBlank String name, String address) {
}
