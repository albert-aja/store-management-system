package com.sms.finance;

import com.sms.finance.dto.CollectionAttemptResponse;
import com.sms.finance.dto.RecordCollectionAttemptRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/finance/collections")
@RequiredArgsConstructor
public class CollectionAttemptController {

    private final FinanceService financeService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyAuthority('FINANCE_MANAGE', 'FINANCE_COLLECT')")
    public CollectionAttemptResponse recordAttempt(@Valid @RequestBody RecordCollectionAttemptRequest req) {
        return financeService.recordCollectionAttempt(req);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('FINANCE_MANAGE', 'FINANCE_COLLECT')")
    public List<CollectionAttemptResponse> listAttempts(
            @RequestParam(required = false) UUID storeId,
            @RequestParam(required = false) UUID customerId) {
        return financeService.listCollectionAttempts(storeId, customerId);
    }
}
