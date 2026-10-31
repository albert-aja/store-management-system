package com.sms.foundation.numbering;

import com.sms.common.web.NotFoundException;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

/**
 * Issues business document numbers using an atomic Redis counter per (store, docType, year).
 * The counter is the source of monotonic uniqueness; gaps are acceptable (cancelled numbers
 * are never reused per README sec 18.4). The counter itself is not the historical record —
 * once assigned, the formatted number is persisted on the owning business document row.
 */
@Service
@RequiredArgsConstructor
public class DocumentNumberingService {

    private static final Duration KEY_TTL = Duration.ofDays(400);

    private final StringRedisTemplate redisTemplate;
    private final StoreRepository storeRepository;

    public String nextNumber(UUID storeId, String docType) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new NotFoundException("Store not found: " + storeId));
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        int year = today.getYear();
        int month = today.getMonthValue();

        String key = "docnum:%s:%s:%d".formatted(storeId, docType, year);
        Long sequence = redisTemplate.opsForValue().increment(key);
        if (sequence == null) {
            throw new IllegalStateException("Redis unavailable: could not issue document number");
        }
        if (sequence == 1L) {
            redisTemplate.expire(key, KEY_TTL);
        }
        return "%s/%s/%02d/%d/%04d".formatted(docType, store.getCode(), month, year, sequence);
    }
}
