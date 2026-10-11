package com.sms.repossession;

import com.sms.repossession.dto.CompleteStockReturnRequest;
import com.sms.repossession.dto.CreateStockReturnRequest;
import com.sms.repossession.dto.RecordDispositionRequest;
import com.sms.repossession.dto.StockReturnResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/returns")
@RequiredArgsConstructor
public class StockReturnController {

    private final RepossessionService repossessionService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('REPOSSESSION_MANAGE')")
    public StockReturnResponse initiateReturn(@Valid @RequestBody CreateStockReturnRequest req) {
        return repossessionService.initiateReturn(req);
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyAuthority('REPOSSESSION_MANAGE', 'REPOSSESSION_EXECUTE')")
    public StockReturnResponse completeReturn(
            @PathVariable UUID id,
            @RequestBody CompleteStockReturnRequest req) {
        return repossessionService.completeReturn(id, req);
    }

    @PostMapping("/{id}/disposition")
    @PreAuthorize("hasAuthority('REPOSSESSION_MANAGE')")
    public StockReturnResponse recordDisposition(
            @PathVariable UUID id,
            @Valid @RequestBody RecordDispositionRequest req) {
        return repossessionService.recordDisposition(id, req);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('REPOSSESSION_MANAGE', 'REPOSSESSION_EXECUTE')")
    public List<StockReturnResponse> listReturns(
            @RequestParam(required = false) UUID storeId,
            @RequestParam(required = false) StockReturnStatus status,
            @RequestParam(required = false) StockReturnType returnType) {
        return repossessionService.listReturns(storeId, status, returnType);
    }
}
