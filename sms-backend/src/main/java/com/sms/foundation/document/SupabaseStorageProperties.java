package com.sms.foundation.document;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "supabase")
public record SupabaseStorageProperties(String url, String serviceRoleKey, String defaultBucket) {
}
