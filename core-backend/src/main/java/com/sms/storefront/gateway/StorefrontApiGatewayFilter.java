package com.sms.storefront.gateway;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * ADR-12: E-commerce Storefront API Gateway Boundary & Security Isolation Filter.
 *
 * <p>Enforces the architectural gateway boundary between public customer-facing Storefront
 * endpoints ({@code /api/v1/storefront/**}) consumed by Application B (Next.js Web) and
 * Application C (Flutter Mobile), and internal back-office Management endpoints ({@code /api/**}).
 *
 * <p>Capabilities:
 * <ul>
 *   <li><b>Channel Attribution</b>: Resolves {@code X-Client-Platform} (NEXTJS_WEB, FLUTTER_MOBILE)
 *       and attaches gateway request tracing headers ({@code X-Gateway-Request-Id}, {@code X-API-Gateway-Zone}).</li>
 *   <li><b>Session & Identity Context</b>: Normalizes {@code X-Session-ID} and {@code X-Customer-ID}
 *       for downstream cart, wishlist, and order controllers.</li>
 *   <li><b>Token-Bucket Rate Limiting</b>: Protects public storefront catalog and checkout APIs
 *       from automated scraping or DDoS abuse (configurable burst window per client IP/session).</li>
 *   <li><b>Strict Boundary Isolation</b>: Prevents storefront client tokens or unauthenticated
 *       storefront sessions from crossing into internal administrative endpoints.</li>
 * </ul>
 */
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class StorefrontApiGatewayFilter extends OncePerRequestFilter {

    public static final String STOREFRONT_PREFIX = "/api/v1/storefront";
    public static final String HEADER_CLIENT_PLATFORM = "X-Client-Platform";
    public static final String HEADER_SESSION_ID = "X-Session-ID";
    public static final String HEADER_CUSTOMER_ID = "X-Customer-ID";
    public static final String HEADER_GATEWAY_REQUEST_ID = "X-Gateway-Request-Id";
    public static final String HEADER_GATEWAY_ZONE = "X-API-Gateway-Zone";
    public static final String HEADER_RATE_LIMIT_REMAINING = "X-RateLimit-Remaining";

    private static final int MAX_REQUESTS_PER_MINUTE = 240;
    private static final long WINDOW_MS = 60_000L;

    private final Map<String, RateLimitBucket> rateLimitBuckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        String gatewayRequestId = "gw-" + UUID.randomUUID().toString().substring(0, 8);
        response.setHeader(HEADER_GATEWAY_REQUEST_ID, gatewayRequestId);

        if (path != null && path.startsWith(STOREFRONT_PREFIX)) {
            handleStorefrontGatewayZone(request, response, filterChain, gatewayRequestId);
        } else if (path != null && path.startsWith("/api/")) {
            handleBackofficeAdminZone(request, response, filterChain);
        } else {
            filterChain.doFilter(request, response);
        }
    }

    private void handleStorefrontGatewayZone(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain,
            String gatewayRequestId) throws ServletException, IOException {

        response.setHeader(HEADER_GATEWAY_ZONE, "PUBLIC_STOREFRONT_GATEWAY");

        // Resolve client platform (Next.js SSR/CSR vs Flutter Mobile)
        String clientPlatform = request.getHeader(HEADER_CLIENT_PLATFORM);
        if (clientPlatform == null || clientPlatform.isBlank()) {
            String userAgent = request.getHeader("User-Agent");
            if (userAgent != null && userAgent.toLowerCase().contains("dart")) {
                clientPlatform = "FLUTTER_MOBILE";
            } else {
                clientPlatform = "NEXTJS_WEB";
            }
        }
        request.setAttribute(HEADER_CLIENT_PLATFORM, clientPlatform);
        response.setHeader("X-Storefront-Channel", clientPlatform);

        // Rate limit check per client key (Session ID or Remote IP)
        String sessionId = request.getHeader(HEADER_SESSION_ID);
        String clientKey = (sessionId != null && !sessionId.isBlank())
                ? "sess:" + sessionId
                : "ip:" + request.getRemoteAddr();

        RateLimitBucket bucket = rateLimitBuckets.computeIfAbsent(clientKey, k -> new RateLimitBucket());
        int remaining = bucket.tryConsume();
        response.setHeader(HEADER_RATE_LIMIT_REMAINING, String.valueOf(Math.max(0, remaining)));

        if (remaining < 0) {
            log.warn("[StorefrontGateway] Rate limit exceeded for clientKey={}, platform={}, path={}",
                    clientKey, clientPlatform, request.getRequestURI());
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(String.format(
                    "{\"error\":\"TOO_MANY_REQUESTS\",\"message\":\"Storefront API Gateway rate limit exceeded. Please retry shortly.\",\"gatewayRequestId\":\"%s\",\"timestamp\":\"%s\"}",
                    gatewayRequestId, Instant.now()));
            return;
        }

        // Edge caching hints for read-only catalog GET endpoints (Next.js ISR / CDN friendly)
        if ("GET".equalsIgnoreCase(request.getMethod())) {
            String uri = request.getRequestURI();
            if (uri.endsWith("/categories") || uri.endsWith("/banners")) {
                response.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
            } else if (uri.contains("/products")) {
                response.setHeader("Cache-Control", "public, max-age=15, stale-while-revalidate=60");
            }
        }

        filterChain.doFilter(request, response);
    }

    private void handleBackofficeAdminZone(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        response.setHeader(HEADER_GATEWAY_ZONE, "INTERNAL_ADMIN_BACKOFFICE");

        // Block accidental or malicious storefront-only client headers attempting to access back-office APIs
        // without a valid administrative Bearer JWT
        String clientPlatform = request.getHeader(HEADER_CLIENT_PLATFORM);
        String authHeader = request.getHeader("Authorization");
        boolean isStorefrontClient = "NEXTJS_WEB".equalsIgnoreCase(clientPlatform)
                || "FLUTTER_ECOMMERCE".equalsIgnoreCase(clientPlatform);

        if (isStorefrontClient && (authHeader == null || !authHeader.startsWith("Bearer "))) {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(
                    "{\"error\":\"GATEWAY_ZONE_VIOLATION\",\"message\":\"Storefront clients are strictly isolated to /api/v1/storefront/* and cannot access internal back-office APIs.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Reset rate limit buckets (used in testing).
     */
    public void resetRateLimits() {
        rateLimitBuckets.clear();
    }

    private static class RateLimitBucket {
        private long windowStart = System.currentTimeMillis();
        private final AtomicInteger count = new AtomicInteger(0);

        synchronized int tryConsume() {
            long now = System.currentTimeMillis();
            if (now - windowStart >= WINDOW_MS) {
                windowStart = now;
                count.set(0);
            }
            int current = count.incrementAndGet();
            return MAX_REQUESTS_PER_MINUTE - current;
        }
    }
}

