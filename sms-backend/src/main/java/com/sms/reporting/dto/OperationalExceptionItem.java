package com.sms.reporting.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OperationalExceptionItem {
    private String exceptionType;
    private String title;
    private String severity; // HIGH, MEDIUM, LOW
    private String referenceCode;
    private String details;
    private String actionUrl;
}
