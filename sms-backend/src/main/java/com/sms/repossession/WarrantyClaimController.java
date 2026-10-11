package com.sms.repossession;

import com.sms.repossession.dto.CreateWarrantyClaimRequest;
import com.sms.repossession.dto.DecideWarrantyClaimRequest;
import com.sms.repossession.dto.WarrantyClaimResponse;
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
@RequestMapping("/api/warranty-claims")
@RequiredArgsConstructor
public class WarrantyClaimController {

    private final RepossessionService repossessionService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('WARRANTY_MANAGE')")
    public WarrantyClaimResponse createClaim(@Valid @RequestBody CreateWarrantyClaimRequest req) {
        return repossessionService.createWarrantyClaim(req);
    }

    @PostMapping("/{id}/decide")
    @PreAuthorize("hasAuthority('WARRANTY_MANAGE')")
    public WarrantyClaimResponse decideClaim(
            @PathVariable UUID id,
            @Valid @RequestBody DecideWarrantyClaimRequest req) {
        return repossessionService.decideWarrantyClaim(id, req);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('WARRANTY_MANAGE')")
    public List<WarrantyClaimResponse> listClaims(
            @RequestParam(required = false) UUID storeId,
            @RequestParam(required = false) WarrantyClaimStatus status) {
        return repossessionService.listWarrantyClaims(storeId, status);
    }
}
