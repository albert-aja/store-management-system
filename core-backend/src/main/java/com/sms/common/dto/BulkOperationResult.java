package com.sms.common.dto;

import java.util.List;
import java.util.UUID;

public record BulkOperationResult(
        int totalRequested,
        int successCount,
        int failureCount,
        List<BulkItemResult> results
) {
    public record BulkItemResult(
            UUID id,
            boolean success,
            String message
    ) {}

    public static BulkOperationResult of(List<BulkItemResult> results) {
        int success = (int) results.stream().filter(BulkItemResult::success).count();
        int failure = results.size() - success;
        return new BulkOperationResult(results.size(), success, failure, results);
    }
}
