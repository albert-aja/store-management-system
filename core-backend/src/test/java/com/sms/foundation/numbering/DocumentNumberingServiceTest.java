package com.sms.foundation.numbering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

@ExtendWith(MockitoExtension.class)
class DocumentNumberingServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;
    @Mock
    private StoreRepository storeRepository;

    @InjectMocks
    private DocumentNumberingService numberingService;

    @Test
    void nextNumber_formatsTypeStoreMonthYearSequence() {
        UUID storeId = UUID.randomUUID();
        Store store = new Store();
        store.setCode("STR01");
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment(any(String.class))).thenReturn(1L);

        String number = numberingService.nextNumber(storeId, "SO");

        assertThat(number).matches("SO/STR01/\\d{2}/\\d{4}/0001");
    }

    @Test
    void nextNumber_setsExpiryOnlyOnFirstIssuedNumber() {
        UUID storeId = UUID.randomUUID();
        Store store = new Store();
        store.setCode("STR01");
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment(any(String.class))).thenReturn(2L);

        numberingService.nextNumber(storeId, "SO");

        org.mockito.Mockito.verify(redisTemplate, org.mockito.Mockito.never())
                .expire(any(String.class), any(Duration.class));
    }
}
