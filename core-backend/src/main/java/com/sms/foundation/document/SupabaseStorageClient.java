package com.sms.foundation.document;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/** Thin client for Supabase Storage's signed-upload and signed-download URL APIs; files are uploaded and downloaded directly by the caller. */
@Component
@EnableConfigurationProperties(SupabaseStorageProperties.class)
public class SupabaseStorageClient {

    private final RestClient restClient;
    private final SupabaseStorageProperties properties;

    public SupabaseStorageClient(SupabaseStorageProperties properties) {
        this.properties = properties;
        this.restClient = RestClient.builder()
                .baseUrl(properties.url() + "/storage/v1")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + properties.serviceRoleKey())
                .build();
    }

    public record SignedUploadUrl(String signedUrl, String token) {
    }

    public record SignedDownloadUrl(
            @JsonProperty("signedURL") String signedURL,
            @JsonProperty("signedUrl") String signedUrl
    ) {
        public String effectiveUrl() {
            return signedUrl != null && !signedUrl.isBlank() ? signedUrl : signedURL;
        }
    }

    public record SignedDownloadRequest(int expiresIn) {
    }

    public SignedUploadUrl createSignedUploadUrl(String bucket, String path) {
        return restClient.post()
                .uri("/object/upload/sign/{bucket}/{path}", bucket, path)
                .contentType(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(SignedUploadUrl.class);
    }

    public String createSignedDownloadUrl(String bucket, String path, int expiresInSeconds) {
        SignedDownloadUrl response = restClient.post()
                .uri("/object/sign/{bucket}/{path}", bucket, path)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new SignedDownloadRequest(expiresInSeconds))
                .retrieve()
                .body(SignedDownloadUrl.class);

        if (response == null || response.effectiveUrl() == null) {
            throw new IllegalStateException("Failed to generate signed download URL from storage service");
        }

        String url = response.effectiveUrl();
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            String base = properties.url();
            if (base.endsWith("/")) {
                base = base.substring(0, base.length() - 1);
            }
            if (!url.startsWith("/")) {
                url = "/" + url;
            }
            if (!url.startsWith("/storage/v1")) {
                url = "/storage/v1" + url;
            }
            url = base + url;
        }
        return url;
    }

    public String defaultBucket() {
        return properties.defaultBucket();
    }
}
