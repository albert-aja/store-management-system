package com.sms.common.web;

/** Thrown when a request violates a business invariant (e.g. workflow status transition). */
public class BusinessRuleException extends RuntimeException {

    public BusinessRuleException(String message) {
        super(message);
    }
}
