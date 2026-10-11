package com.sms.delivery;

public record PreInspectionRequest(
        boolean passed,
        String notes
) {}
