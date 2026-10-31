package com.sms.storefront.gateway;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * ADR-12: Storefront API Gateway Topology & Client Contract Discovery Endpoint.
 *
 * <p>Provides topology diagnostics, active client stack registrations (Next.js 15 Web + Flutter 3.44 Mobile),
 * gateway routing rules, and rate-limit policies for the unified `/api/v1/storefront/*` API gateway.
 */
@RestController
@RequestMapping("/api/v1/storefront/gateway")
public class StorefrontGatewayController {

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getGatewayStatus(
            @RequestHeader(value = StorefrontApiGatewayFilter.HEADER_CLIENT_PLATFORM, required = false) String clientPlatform,
            @RequestHeader(value = StorefrontApiGatewayFilter.HEADER_SESSION_ID, required = false) String sessionId) {

        String resolvedPlatform = (clientPlatform != null && !clientPlatform.isBlank())
                ? clientPlatform
                : "NEXTJS_WEB";

        return ResponseEntity.ok(Map.of(
                "gatewayStatus", "ACTIVE",
                "gatewayPattern", "MODULAR_MONOLITH_EDGE_GATEWAY",
                "adrReference", "ADR-12",
                "isolatedPrefix", "/api/v1/storefront",
                "detectedClientPlatform", resolvedPlatform,
                "activeSessionPresent", sessionId != null && !sessionId.isBlank(),
                "registeredClientStacks", List.of(
                        Map.of(
                                "appCode", "APP_B_ECOMMERCE_WEB",
                                "framework", "Next.js 15 (App Router / React 19)",
                                "rendering", "Hybrid SSR / ISR / Client Components",
                                "platformHeader", "NEXTJS_WEB"
                        ),
                        Map.of(
                                "appCode", "APP_C_ECOMMERCE_MOBILE",
                                "framework", "Flutter 3.44 (Dart 3.12 / Riverpod 3)",
                                "rendering", "Native Impeller Engine (iOS & Android)",
                                "platformHeader", "FLUTTER_MOBILE"
                        )
                ),
                "securityIsolation", Map.of(
                        "storefrontZone", "PUBLIC_STOREFRONT_GATEWAY (/api/v1/storefront/**)",
                        "backofficeZone", "INTERNAL_ADMIN_BACKOFFICE (/api/** requires Employee RBAC JWT)",
                        "rateLimitPerMinute", 240,
                        "moneyManagementCompliance", "MERCHANT_LEDGER_ONLY_NON_BANKING"
                ),
                "serverTimestamp", Instant.now().toString()
        ));
    }
}

