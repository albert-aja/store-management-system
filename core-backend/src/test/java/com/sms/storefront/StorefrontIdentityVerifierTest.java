package com.sms.storefront;

import com.sms.storefront.service.StorefrontIdentityVerifier;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.client.RestClient;

import static org.junit.jupiter.api.Assertions.*;

class StorefrontIdentityVerifierTest {
    private HttpServer server;
    private StorefrontIdentityVerifier verifier;
    private final UUID id = UUID.randomUUID();
    private final AtomicReference<String> body = new AtomicReference<>();
    private final AtomicReference<String> authorization = new AtomicReference<>();

    @BeforeEach
    void startServer() throws Exception {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/auth/v1/user", exchange -> {
            authorization.set(exchange.getRequestHeaders().getFirst("Authorization"));
            byte[] response = body.get().getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length);
            exchange.getResponseBody().write(response);
            exchange.close();
        });
        server.start();
        verifier = new StorefrontIdentityVerifier(RestClient.builder(),
                "http://127.0.0.1:" + server.getAddress().getPort(), "test-public-key");
    }

    @AfterEach
    void stopServer() {
        server.stop(0);
    }

    private Jwt jwt() {
        return Jwt.withTokenValue("test-token").header("alg", "RS256").subject(id.toString()).build();
    }

    @Test
    void validatesCanonicalConfirmedEmailAndForwardsBearer() {
        body.set("{\"id\":\"" + id + "\",\"email\":\"customer@example.com\","
                + "\"email_confirmed_at\":\"2026-01-01T00:00:00Z\"}");
        assertEquals("customer@example.com", verifier.verify(jwt()).email());
        assertEquals("Bearer test-token", authorization.get());
    }

    @Test
    void rejectsUserEditableVerificationMetadata() {
        body.set("{\"id\":\"" + id + "\",\"email\":\"victim@example.com\","
                + "\"email_confirmed_at\":null,\"user_metadata\":{\"email_verified\":true}}");
        assertThrows(BadCredentialsException.class, () -> verifier.verify(jwt()));
    }

    @Test
    void rejectsSubjectMismatch() {
        body.set("{\"id\":\"" + UUID.randomUUID() + "\",\"email\":\"customer@example.com\","
                + "\"email_confirmed_at\":\"2026-01-01T00:00:00Z\"}");
        assertThrows(BadCredentialsException.class, () -> verifier.verify(jwt()));
    }
}
