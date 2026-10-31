package com.sms.common.web;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record ApiError(String code, String message, Instant timestamp, List<FieldError> fieldErrors) {

    public record FieldError(String field, String message) {
    }

    public static ApiError of(String code, String message) {
        return new ApiError(code, message, Instant.now(), List.of());
    }

    public static ApiError ofFieldErrors(String code, String message, Map<String, String> errors) {
        List<FieldError> fieldErrors = errors.entrySet().stream()
                .map(e -> new FieldError(e.getKey(), e.getValue()))
                .toList();
        return new ApiError(code, message, Instant.now(), fieldErrors);
    }
}
