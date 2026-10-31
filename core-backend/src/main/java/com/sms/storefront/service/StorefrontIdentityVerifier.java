package com.sms.storefront.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.UUID;
import java.net.http.HttpClient;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

@Service
public class StorefrontIdentityVerifier {
    private final RestClient client;

    public StorefrontIdentityVerifier(
            RestClient.Builder builder,
            @Value("${supabase.url}") String url,
            @Value("${supabase.publishable-key:${supabase.service-role-key:}}") String key) {
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build());
        requestFactory.setReadTimeout(Duration.ofSeconds(10));
        client = builder.baseUrl(url + "/auth/v1").requestFactory(requestFactory)
                .defaultHeader("apikey", key).build();
    }

    public VerifiedUser verify(Jwt jwt) {
        VerifiedUser user;
        try {
            user = client.get().uri("/user")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwt.getTokenValue())
                    .retrieve().body(VerifiedUser.class);
        } catch (HttpClientErrorException.Unauthorized | HttpClientErrorException.Forbidden ex) {
            throw new BadCredentialsException("Invalid customer session", ex);
        }
        if (user == null || user.id() == null || !user.id().toString().equals(jwt.getSubject())
                || user.email() == null || user.email().isBlank()
                || user.emailConfirmedAt() == null || user.emailConfirmedAt().isBlank()) {
            throw new BadCredentialsException("A verified email is required");
        }
        return user;
    }

    public record VerifiedUser(
            UUID id, String email, @JsonProperty("email_confirmed_at") String emailConfirmedAt) {}
}
