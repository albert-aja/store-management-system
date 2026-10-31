package com.sms.storefront;

import static org.assertj.core.api.Assertions.assertThat;

import com.sms.storefront.gateway.StorefrontApiGatewayFilter;
import com.sms.storefront.gateway.StorefrontGatewayController;
import jakarta.servlet.FilterChain;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class StorefrontApiGatewayTest {

    private StorefrontApiGatewayFilter gatewayFilter;
    private StorefrontGatewayController gatewayController;

    @BeforeEach
    void setUp() {
        gatewayFilter = new StorefrontApiGatewayFilter();
        gatewayController = new StorefrontGatewayController();
    }

    @Test
    void shouldRouteNextJsStorefrontRequestAndAttachGatewayHeaders() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/storefront/products");
        request.addHeader("X-Client-Platform", "NEXTJS_WEB");
        request.addHeader("X-Session-ID", "sess-nextjs-001");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = new MockFilterChain();

        gatewayFilter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(HttpStatus.OK.value());
        assertThat(response.getHeader("X-API-Gateway-Zone")).isEqualTo("PUBLIC_STOREFRONT_GATEWAY");
        assertThat(response.getHeader("X-Storefront-Channel")).isEqualTo("NEXTJS_WEB");
        assertThat(response.getHeader("X-Gateway-Request-Id")).startsWith("gw-");
        assertThat(response.getHeader("Cache-Control")).contains("stale-while-revalidate");
    }

    @Test
    void shouldAutoDetectFlutterMobileFromDartUserAgent() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/storefront/categories");
        request.addHeader("User-Agent", "Dart/3.12 (dart:io)");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = new MockFilterChain();

        gatewayFilter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(HttpStatus.OK.value());
        assertThat(response.getHeader("X-Storefront-Channel")).isEqualTo("FLUTTER_MOBILE");
        assertThat(response.getHeader("Cache-Control")).contains("max-age=60");
    }

    @Test
    void shouldBlockStorefrontClientFromAccessingInternalBackofficeWithoutEmployeeJwt() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/fleet/vehicles");
        request.addHeader("X-Client-Platform", "NEXTJS_WEB");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = new MockFilterChain();

        gatewayFilter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
        assertThat(response.getHeader("X-API-Gateway-Zone")).isEqualTo("INTERNAL_ADMIN_BACKOFFICE");
        assertThat(response.getContentAsString()).contains("GATEWAY_ZONE_VIOLATION");
    }

    @Test
    void shouldEnforceTokenBucketRateLimitingOnExcessiveStorefrontBursts() throws Exception {
        String sessionId = "burst-session-999";

        for (int i = 0; i < 240; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/v1/storefront/products");
            req.addHeader("X-Session-ID", sessionId);
            MockHttpServletResponse res = new MockHttpServletResponse();
            gatewayFilter.doFilter(req, res, new MockFilterChain());
            assertThat(res.getStatus()).isEqualTo(HttpStatus.OK.value());
        }

        // 241st request within the same minute window must be throttled with HTTP 429
        MockHttpServletRequest throttledReq = new MockHttpServletRequest("GET", "/api/v1/storefront/products");
        throttledReq.addHeader("X-Session-ID", sessionId);
        MockHttpServletResponse throttledRes = new MockHttpServletResponse();
        gatewayFilter.doFilter(throttledReq, throttledRes, new MockFilterChain());

        assertThat(throttledRes.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS.value());
        assertThat(throttledRes.getContentAsString()).contains("TOO_MANY_REQUESTS");
    }

    @Test
    void shouldReturnGatewayTopologyStatusForAdr12() {
        ResponseEntity<Map<String, Object>> response = gatewayController.getGatewayStatus("NEXTJS_WEB", "sess-123");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.get("adrReference")).isEqualTo("ADR-12");
        assertThat(body.get("detectedClientPlatform")).isEqualTo("NEXTJS_WEB");
        assertThat(body.get("activeSessionPresent")).isEqualTo(true);
    }
}

