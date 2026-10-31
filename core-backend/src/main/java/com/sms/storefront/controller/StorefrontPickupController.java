package com.sms.storefront.controller;

import com.sms.storefront.dto.HandoverVerificationResultDto;
import com.sms.storefront.dto.StagePickupRequest;
import com.sms.storefront.dto.StorefrontPickupPassDto;
import com.sms.storefront.dto.VerifyHandoverRequest;
import com.sms.storefront.service.StorefrontPickupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/storefront/pickup")
@RequiredArgsConstructor
public class StorefrontPickupController {

    private final StorefrontPickupService pickupService;

    @GetMapping("/pass/{orderNumber}")
    public StorefrontPickupPassDto getPickupPass(@PathVariable String orderNumber) {
        return pickupService.getPickupPass(orderNumber);
    }

    @PostMapping("/stage")
    public StorefrontPickupPassDto stagePickup(@Valid @RequestBody StagePickupRequest request) {
        return pickupService.stagePickupGroup(request);
    }

    @PostMapping("/verify-handover")
    @ResponseStatus(HttpStatus.OK)
    public HandoverVerificationResultDto verifyHandover(@Valid @RequestBody VerifyHandoverRequest request) {
        return pickupService.verifyHandover(request);
    }
}

