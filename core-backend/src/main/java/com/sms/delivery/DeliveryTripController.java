package com.sms.delivery;

import jakarta.validation.Valid;
import com.sms.common.security.SmsUserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
@RequestMapping("/api/delivery-trips")
@RequiredArgsConstructor
public class DeliveryTripController {

    private final DeliveryService deliveryService;
    private final DeliveryRescheduleService rescheduleService;

    @PostMapping("/{id}/schedule")
    @PreAuthorize("hasAuthority('DELIVERY_MANAGE')")
    public DeliveryTripResponse schedule(
            @PathVariable UUID id, @Valid @RequestBody DeliveryRescheduleDto.Schedule input,
            @AuthenticationPrincipal SmsUserPrincipal principal) {
        return rescheduleService.schedule(id, input.plannedDispatchAt(), principal);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('DELIVERY_MANAGE', 'DELIVERY_EXECUTE')")
    public List<DeliveryTripResponse> listTrips(
            @RequestParam(required = false) UUID storeId,
            @RequestParam(required = false) DeliveryTripStatus status,
            @RequestParam(required = false) UUID driverId
    ) {
        return deliveryService.searchTrips(storeId, status, driverId).stream()
                .map(DeliveryTripResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('DELIVERY_MANAGE', 'DELIVERY_EXECUTE')")
    public DeliveryTripResponse getTrip(@PathVariable UUID id) {
        return DeliveryTripResponse.from(deliveryService.getTrip(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('DELIVERY_MANAGE')")
    public DeliveryTripResponse createTrip(@Valid @RequestBody CreateDeliveryTripRequest request) {
        return DeliveryTripResponse.from(deliveryService.createTrip(request));
    }

    @PostMapping("/{id}/dispatch")
    @PreAuthorize("hasAnyAuthority('DELIVERY_MANAGE', 'DELIVERY_EXECUTE')")
    public DeliveryTripResponse dispatchTrip(@PathVariable UUID id) {
        return DeliveryTripResponse.from(deliveryService.dispatchTrip(id));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyAuthority('DELIVERY_MANAGE', 'DELIVERY_EXECUTE')")
    public DeliveryTripResponse completeTrip(@PathVariable UUID id, @RequestBody(required = false) String notes) {
        return DeliveryTripResponse.from(deliveryService.completeTrip(id, notes));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('DELIVERY_MANAGE')")
    public DeliveryTripResponse cancelTrip(@PathVariable UUID id, @RequestBody(required = false) String reason) {
        return DeliveryTripResponse.from(deliveryService.cancelTrip(id, reason));
    }
}
