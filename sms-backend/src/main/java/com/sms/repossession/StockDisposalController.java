package com.sms.repossession;

import com.sms.repossession.dto.CreateStockDisposalRequest;
import com.sms.repossession.dto.StockDisposalResponse;
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
@RequestMapping("/api/disposals")
@RequiredArgsConstructor
public class StockDisposalController {

    private final RepossessionService repossessionService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('REPOSSESSION_MANAGE')")
    public StockDisposalResponse createDisposal(@Valid @RequestBody CreateStockDisposalRequest req) {
        return repossessionService.createStockDisposal(req);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('REPOSSESSION_MANAGE')")
    public List<StockDisposalResponse> listDisposals(@RequestParam(required = false) UUID storeId) {
        return repossessionService.listDisposals(storeId);
    }
}
