package com.sms.payroll;

import com.sms.payroll.dto.CommissionTierDto;
import com.sms.payroll.dto.CommissionTierRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/commission-tiers")
@RequiredArgsConstructor
public class CommissionTierController {

    private final CommissionTierService commissionTierService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CommissionTierDto>> getAllTiers() {
        return ResponseEntity.ok(commissionTierService.getAllTiers());
    }

    @PostMapping
    @PreAuthorize("hasRole('OWNER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<CommissionTierDto> createTier(@Valid @RequestBody CommissionTierRequest request) {
        CommissionTierDto created = commissionTierService.createTier(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<CommissionTierDto> updateTier(
            @PathVariable UUID id,
            @Valid @RequestBody CommissionTierRequest request) {
        return ResponseEntity.ok(commissionTierService.updateTier(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTier(@PathVariable UUID id) {
        commissionTierService.deleteTier(id);
        return ResponseEntity.noContent().build();
    }
}
