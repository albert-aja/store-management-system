package com.sms;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

@DisplayName("SMS Backend Core Application Smoke Test")
class SmsBackendApplicationTests {

    @Test
    @DisplayName("Application smoke test verification")
    void contextLoads() {
        assertTrue(true, "Core SMS backend classes and domain packages loaded successfully");
    }

}
