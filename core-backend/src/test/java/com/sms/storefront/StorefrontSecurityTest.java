package com.sms.storefront;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.crypto.ECDSASigner;
import com.nimbusds.jose.jwk.Curve;
import com.nimbusds.jose.jwk.ECKey;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.ECKeyGenerator;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.sms.common.security.SecurityConfig;
import com.sms.common.security.SupabaseJwtAuthenticationConverter;
import com.sms.storefront.controller.StorefrontAuthController;
import com.sms.storefront.dto.StorefrontAuthDto;
import com.sms.storefront.service.StorefrontAuthService;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.MapPropertySource;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class StorefrontSecurityTest {
    private AnnotationConfigWebApplicationContext context;
    private HttpServer server;
    private RSAKey key;
    private ECKey ecKey;
    private String issuer;
    private MockMvc mvc;

    @BeforeEach
    void setup() throws Exception {
        key = new RSAKeyGenerator(2048).keyID("test-key").generate();
        ecKey = new ECKeyGenerator(Curve.P_256).keyID("ec-test-key").generate();
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/jwks", exchange -> {
            byte[] response = ("{\"keys\":[" + key.toPublicJWK().toJSONString()
                    + "," + ecKey.toPublicJWK().toJSONString() + "]}")
                    .getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length);
            exchange.getResponseBody().write(response);
            exchange.close();
        });
        server.start();
        String url = "http://127.0.0.1:" + server.getAddress().getPort();
        issuer = url + "/auth/v1";
        context = new AnnotationConfigWebApplicationContext();
        context.setServletContext(new MockServletContext());
        context.getEnvironment().getPropertySources().addFirst(new MapPropertySource("test", Map.of(
                "supabase.url", url,
                "spring.security.oauth2.resourceserver.jwt.jwk-set-uri", url + "/jwks")));
        context.register(SecurityConfig.class, TestConfig.class);
        context.refresh();
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @AfterEach
    void cleanup() {
        if (context != null) context.close();
        if (server != null) server.stop(0);
    }

    private String token(String tokenIssuer, Instant expiry, RSAKey signingKey) throws Exception {
        SignedJWT jwt = new SignedJWT(
                new JWSHeader.Builder(JWSAlgorithm.RS256).keyID("test-key").build(),
                new JWTClaimsSet.Builder().subject(UUID.randomUUID().toString())
                        .issuer(tokenIssuer).audience("authenticated")
                        .issueTime(Date.from(Instant.now().minusSeconds(120)))
                        .expirationTime(Date.from(expiry)).build());
        jwt.sign(new RSASSASigner(signingKey));
        return jwt.serialize();
    }

    @Test
    void guestCatalogRemainsPublicButSessionRequiresBearer() throws Exception {
        mvc.perform(get("/api/v1/storefront/catalog-test")).andExpect(status().isOk());
        mvc.perform(post("/api/v1/storefront/auth/session")).andExpect(status().isUnauthorized());
    }

    @Test
    void verifiedCustomerJwtDoesNotRequireEmployeeOrGrantManagementAccess() throws Exception {
        String jwt = token(issuer, Instant.now().plusSeconds(600), key);
        StorefrontAuthService service = context.getBean(StorefrontAuthService.class);
        when(service.session(any())).thenReturn(new StorefrontAuthDto.ProfileResponse(
                UUID.randomUUID(), "customer@example.com", "Customer", null));
        mvc.perform(post("/api/v1/storefront/auth/session").header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk()).andExpect(jsonPath("$.email").value("customer@example.com"));
        verifyNoInteractions(context.getBean(SupabaseJwtAuthenticationConverter.class));
        mvc.perform(get("/api/v1/internal-test").header("Authorization", "Bearer " + jwt))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void acceptsSupabaseEs256SigningKeys() throws Exception {
        SignedJWT jwt = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.ES256).keyID("ec-test-key").build(),
                new JWTClaimsSet.Builder().subject(UUID.randomUUID().toString())
                        .issuer(issuer).audience("authenticated")
                        .expirationTime(Date.from(Instant.now().plusSeconds(600))).build());
        jwt.sign(new ECDSASigner(ecKey));
        when(context.getBean(StorefrontAuthService.class).session(any()))
                .thenReturn(new StorefrontAuthDto.ProfileResponse(UUID.randomUUID(),
                        "customer@example.com", "Customer", null));
        mvc.perform(post("/api/v1/storefront/auth/session").header("Authorization", "Bearer " + jwt.serialize()))
                .andExpect(status().isOk());
    }

    @Test
    void rejectsWrongIssuerExpiredTokenAndForgedSignature() throws Exception {
        for (String jwt : java.util.List.of(
                token("https://another-project.example/auth/v1", Instant.now().plusSeconds(600), key),
                token(issuer, Instant.now().minusSeconds(120), key),
                token(issuer, Instant.now().plusSeconds(600), new RSAKeyGenerator(2048).generate()))) {
            mvc.perform(post("/api/v1/storefront/auth/session").header("Authorization", "Bearer " + jwt))
                    .andExpect(status().isUnauthorized());
        }
        verifyNoInteractions(context.getBean(StorefrontAuthService.class));
    }

    @Configuration
    @EnableWebMvc
    static class TestConfig {
        @Bean
        SupabaseJwtAuthenticationConverter converter() {
            SupabaseJwtAuthenticationConverter converter = mock(SupabaseJwtAuthenticationConverter.class);
            when(converter.convert(any())).thenThrow(
                    new org.springframework.security.authentication.BadCredentialsException("No employee linked"));
            return converter;
        }

        @Bean
        JwtDecoder jwtDecoder(
                @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}") String uri) {
            return NimbusJwtDecoder.withJwkSetUri(uri).build();
        }

        @Bean
        StorefrontAuthService authService() {
            return mock(StorefrontAuthService.class);
        }

        @Bean
        StorefrontAuthController authController(StorefrontAuthService service) {
            return new StorefrontAuthController(service);
        }

        @Bean
        CatalogController catalogController() {
            return new CatalogController();
        }
    }

    @RestController
    static class CatalogController {
        @GetMapping("/api/v1/storefront/catalog-test")
        String catalog() {
            return "catalog";
        }
    }
}
