package com.sms.delivery;

import com.sms.common.security.SmsUserPrincipal;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/delivery-reschedules")
@PreAuthorize("hasAuthority('DELIVERY_MANAGE')")
@RequiredArgsConstructor
public class DeliveryRescheduleController {
    private final DeliveryRescheduleService service;

    @GetMapping
    public List<DeliveryRescheduleDto.Request> pending(@AuthenticationPrincipal SmsUserPrincipal principal) {
        return service.pending(principal);
    }

    @PostMapping("/{id}/approve")
    public DeliveryRescheduleDto.Request approve(
            @PathVariable UUID id, @Valid @RequestBody DeliveryRescheduleDto.Approve input,
            @AuthenticationPrincipal SmsUserPrincipal principal) {
        return service.approve(id, input, principal);
    }

    @PostMapping("/{id}/reject")
    public DeliveryRescheduleDto.Request reject(
            @PathVariable UUID id, @Valid @RequestBody DeliveryRescheduleDto.Reject input,
            @AuthenticationPrincipal SmsUserPrincipal principal) {
        return service.reject(id, input.notes(), principal);
    }
}
