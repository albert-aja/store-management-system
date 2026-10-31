package com.sms.storefront.controller;

import com.sms.delivery.DeliveryRescheduleDto;
import com.sms.delivery.DeliveryRescheduleService;
import com.sms.storefront.service.StorefrontAuthService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/storefront/delivery-schedules")
@RequiredArgsConstructor
public class StorefrontDeliveryScheduleController {
    private final StorefrontAuthService authService;
    private final DeliveryRescheduleService service;

    @GetMapping("/orders/{orderId}")
    public List<DeliveryRescheduleDto.Stop> stops(@PathVariable UUID orderId, @AuthenticationPrincipal Jwt jwt) {
        return service.customerStops(authService.requireCustomerId(jwt), orderId);
    }

    @PostMapping("/{deliveryOrderId}/requests")
    public DeliveryRescheduleDto.Request submit(
            @PathVariable UUID deliveryOrderId, @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody DeliveryRescheduleDto.Submit input) {
        return service.submit(authService.requireCustomerId(jwt), deliveryOrderId, input);
    }
}
