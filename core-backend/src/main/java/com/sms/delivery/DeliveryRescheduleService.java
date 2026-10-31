package com.sms.delivery;

import com.sms.common.security.SmsUserPrincipal;
import com.sms.common.web.BusinessRuleException;
import com.sms.common.web.ConflictException;
import com.sms.common.web.NotFoundException;
import com.sms.storefront.model.StorefrontCustomer;
import com.sms.storefront.repository.StorefrontCustomerRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class DeliveryRescheduleService {
    private final DeliveryOrderRepository orderRepository;
    private final DeliveryTripRepository tripRepository;
    private final DeliveryRescheduleRepository requestRepository;
    private final StorefrontCustomerRepository customerRepository;
    private final EntityManager entityManager;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<DeliveryRescheduleDto.Stop> customerStops(UUID customerId, UUID salesOrderId) {
        StorefrontCustomer customer = customer(customerId);
        List<DeliveryOrder> orders = orderRepository.findBySalesOrderIdOrderByCreatedAtDesc(salesOrderId);
        orders.forEach(order -> requireOwnership(customer, order));
        return orders.stream().map(order -> {
            var history = requestRepository.findByDeliveryOrderIdOrderByCreatedAtDesc(order.getId());
            String unavailable = unavailableReason(order, clock.instant());
            if (unavailable == null && history.stream().anyMatch(r -> r.getStatus() == DeliveryRescheduleRequest.Status.PENDING)) {
                unavailable = "A reschedule request is already awaiting dispatcher review";
            }
            DeliveryTrip trip = order.getDeliveryTrip();
            return new DeliveryRescheduleDto.Stop(order.getId(), order.getDeliveryOrderNumber(),
                    trip == null ? null : trip.getPlannedDispatchAt(),
                    trip == null ? null : trip.getScheduledDate(), order.getDeliveryWindow(),
                    unavailable == null, unavailable, history.stream().map(DeliveryRescheduleDto.Request::from).toList());
        }).toList();
    }

    public DeliveryRescheduleDto.Request submit(UUID customerId, UUID orderId, DeliveryRescheduleDto.Submit input) {
        StorefrontCustomer customer = customer(customerId);
        DeliveryOrder order = order(orderId);
        requireOwnership(customer, order);
        Instant now = clock.instant();
        String unavailable = unavailableReason(order, now);
        if (unavailable != null) throw new BusinessRuleException(unavailable);
        if (input.requestedDate() == null || input.requestedWindow() == null) {
            throw new BusinessRuleException("Requested date and delivery window are required");
        }
        if (input.requestedDate().atTime(input.requestedWindow().start).atZone(DeliveryWindow.ZONE)
                .toInstant().isBefore(now.plus(24, ChronoUnit.HOURS))) {
            throw new BusinessRuleException("Requested delivery window must start at least 24 hours from now");
        }
        if (requestRepository.existsByDeliveryOrderIdAndStatus(orderId, DeliveryRescheduleRequest.Status.PENDING)) {
            throw new ConflictException("A reschedule request is already awaiting dispatcher review");
        }
        entityManager.lock(order.getDeliveryTrip(), LockModeType.OPTIMISTIC);
        entityManager.lock(order, LockModeType.OPTIMISTIC);
        DeliveryRescheduleRequest request = new DeliveryRescheduleRequest();
        request.setDeliveryOrder(order);
        request.setRequester(customer);
        request.setOriginalTrip(order.getDeliveryTrip());
        request.setOriginalDispatchAt(order.getDeliveryTrip().getPlannedDispatchAt());
        request.setRequestedDate(input.requestedDate());
        request.setRequestedWindow(input.requestedWindow());
        request.setReason(input.reason());
        try {
            return DeliveryRescheduleDto.Request.from(requestRepository.saveAndFlush(request));
        } catch (DataIntegrityViolationException ex) {
            if (ex.getMostSpecificCause().getMessage() != null &&
                    ex.getMostSpecificCause().getMessage().contains("delivery_reschedule_one_pending")) {
                throw new ConflictException("A reschedule request is already awaiting dispatcher review");
            }
            throw ex;
        }
    }

    @Transactional(readOnly = true)
    public List<DeliveryRescheduleDto.Request> pending(SmsUserPrincipal principal) {
        return requestRepository.findByStatusOrderByCreatedAtAsc(DeliveryRescheduleRequest.Status.PENDING)
                .stream().filter(request -> hasStore(principal, request.getDeliveryOrder().getSalesOrder().getStore().getId()))
                .map(DeliveryRescheduleDto.Request::from).toList();
    }

    public DeliveryRescheduleDto.Request approve(UUID requestId, DeliveryRescheduleDto.Approve input, SmsUserPrincipal principal) {
        DeliveryRescheduleRequest request = request(requestId, principal);
        DeliveryOrder order = request.getDeliveryOrder();
        Instant now = clock.instant();
        String unavailable = unavailableReason(order, now);
        if (unavailable != null) throw new BusinessRuleException(unavailable);
        if (!Objects.equals(order.getDeliveryTrip().getId(), request.getOriginalTrip().getId()) ||
                !Objects.equals(order.getDeliveryTrip().getPlannedDispatchAt(), request.getOriginalDispatchAt())) {
            throw new ConflictException("Delivery schedule changed after this request; reject it and ask the customer to request again");
        }
        DeliveryTrip target = trip(input.targetTripId());
        if (!target.getStore().getId().equals(order.getSalesOrder().getStore().getId()) ||
                target.getStatus() != DeliveryTripStatus.PLANNED ||
                !target.getScheduledDate().equals(request.getRequestedDate()) ||
                target.getPlannedDispatchAt() == null ||
                target.getPlannedDispatchAt().isBefore(now.plus(24, ChronoUnit.HOURS)) ||
                request.getRequestedDate().atTime(request.getRequestedWindow().start)
                    .atZone(DeliveryWindow.ZONE).toInstant().isBefore(now.plus(24, ChronoUnit.HOURS)) ||
                !target.getPlannedDispatchAt().atZone(DeliveryWindow.ZONE).toLocalDate().equals(request.getRequestedDate()) ||
                !target.getPlannedDispatchAt().isBefore(
                    request.getRequestedDate().atTime(request.getRequestedWindow().end).atZone(DeliveryWindow.ZONE).toInstant())) {
            throw new BusinessRuleException("Choose a PLANNED trip in the same store on the requested date, with dispatch at least 24 hours away and before the delivery window ends");
        }
        entityManager.lock(order.getDeliveryTrip(), LockModeType.OPTIMISTIC_FORCE_INCREMENT);
        if (!target.getId().equals(order.getDeliveryTrip().getId())) {
            entityManager.lock(target, LockModeType.OPTIMISTIC_FORCE_INCREMENT);
        }
        if (!target.getId().equals(request.getOriginalTrip().getId())) {
            int nextStop = orderRepository.findByDeliveryTripIdOrderByStopSequenceAsc(target.getId())
                    .stream().mapToInt(DeliveryOrder::getStopSequence).max().orElse(0) + 1;
            order.setStopSequence(nextStop);
        }
        order.setDeliveryTrip(target);
        order.setDeliveryWindow(request.getRequestedWindow());
        request.setAssignedTrip(target);
        decide(request, DeliveryRescheduleRequest.Status.APPROVED, principal.employeeId(), input.notes());
        return DeliveryRescheduleDto.Request.from(request);
    }

    public DeliveryRescheduleDto.Request reject(UUID requestId, String notes, SmsUserPrincipal principal) {
        if (notes == null || notes.isBlank()) throw new BusinessRuleException("Rejection reason is required");
        DeliveryRescheduleRequest request = request(requestId, principal);
        decide(request, DeliveryRescheduleRequest.Status.REJECTED, principal.employeeId(), notes);
        return DeliveryRescheduleDto.Request.from(request);
    }

    public DeliveryTripResponse schedule(UUID tripId, Instant plannedDispatchAt, SmsUserPrincipal principal) {
        DeliveryTrip trip = trip(tripId);
        requireStore(principal, trip.getStore().getId());
        if (trip.getStatus() != DeliveryTripStatus.PLANNED) {
            throw new BusinessRuleException("Only PLANNED trips can change dispatch schedule");
        }
        if (plannedDispatchAt == null || !plannedDispatchAt.isAfter(clock.instant())) {
            throw new BusinessRuleException("Planned dispatch must be in the future");
        }
        trip.setPlannedDispatchAt(plannedDispatchAt);
        trip.setScheduledDate(plannedDispatchAt.atZone(DeliveryWindow.ZONE).toLocalDate());
        return DeliveryTripResponse.from(trip);
    }

    private void decide(DeliveryRescheduleRequest request, DeliveryRescheduleRequest.Status status, UUID employeeId, String notes) {
        request.setStatus(status);
        request.setDecidedAt(clock.instant());
        request.setDecidedBy(employeeId);
        request.setDecisionNotes(notes);
    }

    static String unavailableReason(DeliveryOrder order, Instant now) {
        if (order.getStatus() != DeliveryOrderStatus.PENDING) return "Only pending deliveries can be rescheduled";
        DeliveryTrip trip = order.getDeliveryTrip();
        if (trip == null || trip.getPlannedDispatchAt() == null) return "Dispatch has not set a planned departure time";
        if (trip.getStatus() != DeliveryTripStatus.PLANNED) return "Trip has already dispatched or is no longer planned";
        if (trip.getPlannedDispatchAt().isBefore(now.plus(24, ChronoUnit.HOURS))) {
            return "Reschedule requests close 24 hours before planned dispatch";
        }
        return null;
    }

    private StorefrontCustomer customer(UUID id) {
        return customerRepository.findById(id).orElseThrow(() -> new NotFoundException("Customer account not found"));
    }

    private void requireOwnership(StorefrontCustomer customer, DeliveryOrder order) {
        if (customer.getCustomer() == null || order.getSalesOrder().getCustomer() == null ||
                !customer.getCustomer().getId().equals(order.getSalesOrder().getCustomer().getId())) {
            throw new AccessDeniedException("Cannot reschedule another customer's delivery");
        }
        String source = order.getSalesOrder().getOrderSource();
        if (source == null || !source.startsWith("ONLINE_")) {
            throw new BusinessRuleException("Self-service rescheduling is only available for storefront delivery orders");
        }
    }

    private DeliveryOrder order(UUID id) {
        return orderRepository.findById(id).orElseThrow(() -> new NotFoundException("Delivery order not found"));
    }

    private DeliveryTrip trip(UUID id) {
        return tripRepository.findById(id).orElseThrow(() -> new NotFoundException("Delivery trip not found"));
    }

    private DeliveryRescheduleRequest request(UUID id, SmsUserPrincipal principal) {
        DeliveryRescheduleRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Reschedule request not found"));
        requireStore(principal, request.getDeliveryOrder().getSalesOrder().getStore().getId());
        if (request.getStatus() != DeliveryRescheduleRequest.Status.PENDING) {
            throw new ConflictException("Reschedule request has already been decided");
        }
        return request;
    }

    private boolean hasStore(SmsUserPrincipal principal, UUID storeId) {
        return principal != null && (principal.hasRole("SYSADMIN") || principal.hasRole("SUPER_ADMIN") || principal.hasStore(storeId));
    }

    private void requireStore(SmsUserPrincipal principal, UUID storeId) {
        if (!hasStore(principal, storeId)) throw new AccessDeniedException("Cannot manage deliveries in another store");
    }
}
