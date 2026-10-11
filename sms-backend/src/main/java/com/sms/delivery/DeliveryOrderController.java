package com.sms.delivery;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/delivery-orders")
@RequiredArgsConstructor
public class DeliveryOrderController {

    private final DeliveryService deliveryService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('DELIVERY_MANAGE', 'DELIVERY_EXECUTE')")
    public List<DeliveryOrderResponse> searchOrders(
            @RequestParam(required = false) UUID salesOrderId,
            @RequestParam(required = false) UUID tripId,
            @RequestParam(required = false) DeliveryOrderStatus status
    ) {
        return deliveryService.searchDeliveryOrders(salesOrderId, tripId, status).stream()
                .map(DeliveryOrderResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('DELIVERY_MANAGE', 'DELIVERY_EXECUTE')")
    public DeliveryOrderResponse getOrder(@PathVariable UUID id) {
        return DeliveryOrderResponse.from(deliveryService.getDeliveryOrder(id));
    }

    @GetMapping("/by-trip/{tripId}")
    @PreAuthorize("hasAnyAuthority('DELIVERY_MANAGE', 'DELIVERY_EXECUTE')")
    public List<DeliveryOrderResponse> listByTrip(@PathVariable UUID tripId) {
        return deliveryService.listByTrip(tripId).stream()
                .map(DeliveryOrderResponse::from)
                .toList();
    }

    @GetMapping("/by-sales-order/{salesOrderId}")
    @PreAuthorize("hasAnyAuthority('DELIVERY_MANAGE', 'DELIVERY_EXECUTE', 'SALES_ORDER_MANAGE')")
    public List<DeliveryOrderResponse> listBySalesOrder(@PathVariable UUID salesOrderId) {
        return deliveryService.listBySalesOrder(salesOrderId).stream()
                .map(DeliveryOrderResponse::from)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('DELIVERY_MANAGE')")
    public DeliveryOrderResponse createOrder(@Valid @RequestBody CreateDeliveryOrderRequest request) {
        return DeliveryOrderResponse.from(deliveryService.createDeliveryOrder(request));
    }

    @PutMapping("/{id}/pre-inspection")
    @PreAuthorize("hasAnyAuthority('DELIVERY_MANAGE', 'DELIVERY_EXECUTE')")
    public DeliveryOrderResponse recordPreInspection(
            @PathVariable UUID id,
            @RequestBody PreInspectionRequest request
    ) {
        return DeliveryOrderResponse.from(deliveryService.recordPreInspection(id, request.passed(), request.notes()));
    }

    @PostMapping("/{id}/deliver")
    @PreAuthorize("hasAnyAuthority('DELIVERY_MANAGE', 'DELIVERY_EXECUTE')")
    public DeliveryOrderResponse deliverOrder(
            @PathVariable UUID id,
            @Valid @RequestBody CompleteDeliveryOrderRequest request
    ) {
        return DeliveryOrderResponse.from(deliveryService.deliverOrder(id, request));
    }

    @PostMapping("/{id}/fail")
    @PreAuthorize("hasAnyAuthority('DELIVERY_MANAGE', 'DELIVERY_EXECUTE')")
    public DeliveryOrderResponse failOrder(
            @PathVariable UUID id,
            @Valid @RequestBody FailDeliveryOrderRequest request
    ) {
        return DeliveryOrderResponse.from(deliveryService.failDeliveryOrder(id, request));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('DELIVERY_MANAGE')")
    public DeliveryOrderResponse cancelOrder(
            @PathVariable UUID id,
            @RequestBody(required = false) String reason
    ) {
        return DeliveryOrderResponse.from(deliveryService.cancelDeliveryOrder(id, reason));
    }
}
