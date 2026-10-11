package com.sms.foundation.document;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/** Thin client for Supabase Storage's signed-upload-URL API; files are uploaded directly by the caller, not proxied here. */
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

    public SignedUploadUrl createSignedUploadUrl(String bucket, String path) {
        return restClient.post()
                .uri("/object/upload/sign/{bucket}/{path}", bucket, path)
                .contentType(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(SignedUploadUrl.class);
    }

    public String defaultBucket() {
        return properties.defaultBucket();
    }
}
