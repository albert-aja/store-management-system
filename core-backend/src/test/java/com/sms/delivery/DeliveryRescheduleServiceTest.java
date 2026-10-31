package com.sms.delivery;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.sms.common.security.SmsUserPrincipal;
import com.sms.common.web.BusinessRuleException;
import com.sms.common.web.ConflictException;
import com.sms.customer.Customer;
import com.sms.foundation.store.Store;
import com.sms.sales.SalesOrder;
import com.sms.storefront.model.StorefrontCustomer;
import com.sms.storefront.repository.StorefrontCustomerRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

class DeliveryRescheduleServiceTest {
    private final DeliveryOrderRepository orders = mock(DeliveryOrderRepository.class);
    private final DeliveryTripRepository trips = mock(DeliveryTripRepository.class);
    private final DeliveryRescheduleRepository requests = mock(DeliveryRescheduleRepository.class);
    private final StorefrontCustomerRepository customers = mock(StorefrontCustomerRepository.class);
    private final EntityManager em = mock(EntityManager.class);
    private final Instant now = Instant.parse("2026-10-31T00:00:00Z");
    private final UUID accountId = UUID.randomUUID();
    private final UUID orderId = UUID.randomUUID();
    private final UUID requestId = UUID.randomUUID();
    private final UUID storeId = UUID.randomUUID();
    private DeliveryRescheduleService service;
    private DeliveryOrder order;
    private DeliveryTrip original;
    private DeliveryTrip target;
    private DeliveryRescheduleRequest pending;
    private StorefrontCustomer account;
    private SmsUserPrincipal dispatcher;

    @BeforeEach
    void setup() {
        service = new DeliveryRescheduleService(orders, trips, requests, customers, em, Clock.fixed(now, ZoneOffset.UTC));
        Store store = new Store();
        ReflectionTestUtils.setField(store, "id", storeId);
        Customer master = new Customer();
        ReflectionTestUtils.setField(master, "id", UUID.randomUUID());
        account = new StorefrontCustomer();
        account.setCustomer(master);
        SalesOrder salesOrder = new SalesOrder();
        ReflectionTestUtils.setField(salesOrder, "id", UUID.randomUUID());
        salesOrder.setCustomer(master);
        salesOrder.setStore(store);
        salesOrder.setOrderSource("ONLINE_WEB");
        original = new DeliveryTrip();
        ReflectionTestUtils.setField(original, "id", UUID.randomUUID());
        original.setStore(store);
        original.setPlannedDispatchAt(now.plus(48, ChronoUnit.HOURS));
        original.setScheduledDate(LocalDate.of(2026, 11, 2));
        target = new DeliveryTrip();
        ReflectionTestUtils.setField(target, "id", UUID.randomUUID());
        target.setStore(store);
        target.setScheduledDate(LocalDate.of(2026, 11, 3));
        target.setPlannedDispatchAt(Instant.parse("2026-11-03T01:00:00Z"));
        order = new DeliveryOrder();
        ReflectionTestUtils.setField(order, "id", orderId);
        order.setDeliveryOrderNumber("DO-1");
        order.setSalesOrder(salesOrder);
        order.setDeliveryTrip(original);
        pending = new DeliveryRescheduleRequest();
        ReflectionTestUtils.setField(pending, "id", requestId);
        pending.setDeliveryOrder(order);
        pending.setOriginalTrip(original);
        pending.setOriginalDispatchAt(original.getPlannedDispatchAt());
        pending.setRequester(account);
        pending.setRequestedDate(target.getScheduledDate());
        pending.setRequestedWindow(DeliveryWindow.MORNING);
        dispatcher = new SmsUserPrincipal(UUID.randomUUID(), UUID.randomUUID(), Set.of(), Set.of(storeId));
        when(customers.findById(accountId)).thenReturn(Optional.of(account));
        when(orders.findById(orderId)).thenReturn(Optional.of(order));
        when(requests.findById(requestId)).thenReturn(Optional.of(pending));
        when(trips.findById(target.getId())).thenReturn(Optional.of(target));
        when(trips.findById(original.getId())).thenReturn(Optional.of(original));
        when(requests.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private DeliveryRescheduleDto.Submit input() {
        return new DeliveryRescheduleDto.Submit(LocalDate.of(2026, 11, 3), DeliveryWindow.MORNING, "New date");
    }

    @Test
    void exact24HoursAllowedButOneNanosecondInsideCutoffRejected() {
        original.setPlannedDispatchAt(now.plus(24, ChronoUnit.HOURS));
        assertNull(DeliveryRescheduleService.unavailableReason(order, now));
        original.setPlannedDispatchAt(now.plus(24, ChronoUnit.HOURS).minusNanos(1));
        assertNotNull(DeliveryRescheduleService.unavailableReason(order, now));
        assertThrows(BusinessRuleException.class, () -> service.submit(accountId, orderId, input()));
    }

    @Test
    void noDepartureTimeOrAlreadyDispatchedNeverEligible() {
        original.setPlannedDispatchAt(null);
        assertNotNull(DeliveryRescheduleService.unavailableReason(order, now));
        original.setPlannedDispatchAt(now.plus(48, ChronoUnit.HOURS));
        original.setStatus(DeliveryTripStatus.DISPATCHED);
        assertThrows(BusinessRuleException.class, () -> service.submit(accountId, orderId, input()));
        original.setStatus(DeliveryTripStatus.PLANNED);
        for (DeliveryOrderStatus status : DeliveryOrderStatus.values()) {
            if (status == DeliveryOrderStatus.PENDING) continue;
            order.setStatus(status);
            assertNotNull(DeliveryRescheduleService.unavailableReason(order, now));
        }
    }

    @Test
    void customerCannotReadOrRequestAnotherCustomersStop() {
        Customer other = new Customer();
        ReflectionTestUtils.setField(other, "id", UUID.randomUUID());
        account.setCustomer(other);
        assertThrows(AccessDeniedException.class, () -> service.submit(accountId, orderId, input()));
        when(orders.findBySalesOrderIdOrderByCreatedAtDesc(order.getSalesOrder().getId())).thenReturn(List.of(order));
        assertThrows(AccessDeniedException.class, () -> service.customerStops(accountId, order.getSalesOrder().getId()));
        verify(requests, never()).saveAndFlush(any());
    }

    @Test
    void requestStoresAuditSnapshotWithoutChangingActualTrip() {
        var result = service.submit(accountId, orderId, input());
        assertEquals(DeliveryRescheduleRequest.Status.PENDING, result.status());
        assertSame(original, order.getDeliveryTrip());
        assertEquals(now.plus(48, ChronoUnit.HOURS), original.getPlannedDispatchAt());
        verify(em).lock(original, LockModeType.OPTIMISTIC);
        verify(em).lock(order, LockModeType.OPTIMISTIC);
    }

    @Test
    void duplicatePendingRequestRejectedAndHistoryDisablesForm() {
        when(requests.existsByDeliveryOrderIdAndStatus(orderId, DeliveryRescheduleRequest.Status.PENDING)).thenReturn(true);
        assertThrows(ConflictException.class, () -> service.submit(accountId, orderId, input()));
        when(orders.findBySalesOrderIdOrderByCreatedAtDesc(order.getSalesOrder().getId())).thenReturn(List.of(order));
        when(requests.findByDeliveryOrderIdOrderByCreatedAtDesc(orderId)).thenReturn(List.of(pending));
        var stop = service.customerStops(accountId, order.getSalesOrder().getId()).getFirst();
        assertFalse(stop.eligible());
        assertEquals(1, stop.requests().size());
    }

    @Test
    void requestedWindowUsesWibAndMustRemain24HoursAway() {
        // Next-day morning starts at 02:00 UTC, only 23h away from this clock.
        service = new DeliveryRescheduleService(orders, trips, requests, customers, em,
                Clock.fixed(Instant.parse("2026-10-31T03:00:00Z"), ZoneOffset.UTC));
        assertThrows(BusinessRuleException.class, () -> service.submit(accountId, orderId,
                new DeliveryRescheduleDto.Submit(LocalDate.of(2026, 11, 1), DeliveryWindow.MORNING, null)));
        assertEquals(DeliveryRescheduleRequest.Status.PENDING, service.submit(accountId, orderId,
                new DeliveryRescheduleDto.Submit(LocalDate.of(2026, 11, 1), DeliveryWindow.AFTERNOON, null)).status());
    }

    @Test
    void approveMovesOnlyRequestedStopAndPreservesSharedTripDate() {
        DeliveryOrder peer = new DeliveryOrder();
        peer.setDeliveryTrip(original);
        DeliveryOrder existingTargetStop = new DeliveryOrder();
        existingTargetStop.setStopSequence(3);
        when(orders.findByDeliveryTripIdOrderByStopSequenceAsc(target.getId())).thenReturn(List.of(existingTargetStop));
        var result = service.approve(requestId, new DeliveryRescheduleDto.Approve(target.getId(), "Confirmed"), dispatcher);
        assertEquals(DeliveryRescheduleRequest.Status.APPROVED, result.status());
        assertSame(target, order.getDeliveryTrip());
        assertSame(original, peer.getDeliveryTrip());
        assertEquals(LocalDate.of(2026, 11, 2), original.getScheduledDate());
        assertEquals(4, order.getStopSequence());
        assertEquals(DeliveryWindow.MORNING, order.getDeliveryWindow());
        assertEquals(dispatcher.employeeId(), pending.getDecidedBy());
        assertEquals(now, pending.getDecidedAt());
        verify(em).lock(original, LockModeType.OPTIMISTIC_FORCE_INCREMENT);
        verify(em).lock(target, LockModeType.OPTIMISTIC_FORCE_INCREMENT);
        assertThrows(ConflictException.class, () -> service.approve(requestId,
                new DeliveryRescheduleDto.Approve(target.getId(), null), dispatcher));
    }

    @Test
    void changedOriginalScheduleAndInsideCutoffCannotApprove() {
        original.setPlannedDispatchAt(now.plus(49, ChronoUnit.HOURS));
        assertThrows(ConflictException.class, () -> service.approve(requestId,
                new DeliveryRescheduleDto.Approve(target.getId(), null), dispatcher));
        original.setPlannedDispatchAt(now.plus(23, ChronoUnit.HOURS));
        assertThrows(BusinessRuleException.class, () -> service.approve(requestId,
                new DeliveryRescheduleDto.Approve(target.getId(), null), dispatcher));
        assertSame(original, order.getDeliveryTrip());
    }

    @Test
    void invalidTargetTripCannotMoveOrder() {
        target.setScheduledDate(LocalDate.of(2026, 11, 4));
        assertThrows(BusinessRuleException.class, () -> service.approve(requestId,
                new DeliveryRescheduleDto.Approve(target.getId(), null), dispatcher));
        target.setScheduledDate(LocalDate.of(2026, 11, 3));
        target.setStatus(DeliveryTripStatus.DISPATCHED);
        assertThrows(BusinessRuleException.class, () -> service.approve(requestId,
                new DeliveryRescheduleDto.Approve(target.getId(), null), dispatcher));
        assertSame(original, order.getDeliveryTrip());
        assertEquals(DeliveryRescheduleRequest.Status.PENDING, pending.getStatus());
    }

    @Test
    void crossStoreReviewRejectedAndRejectionLeavesScheduleUnchanged() {
        var otherDispatcher = new SmsUserPrincipal(UUID.randomUUID(), UUID.randomUUID(), Set.of(), Set.of(UUID.randomUUID()));
        assertThrows(AccessDeniedException.class, () -> service.reject(requestId, "Unavailable", otherDispatcher));
        assertThrows(BusinessRuleException.class, () -> service.reject(requestId, "", dispatcher));
        var result = service.reject(requestId, "No capacity", dispatcher);
        assertEquals(DeliveryRescheduleRequest.Status.REJECTED, result.status());
        assertEquals("No capacity", result.decisionNotes());
        assertSame(original, order.getDeliveryTrip());
    }

    @Test
    void queueIsStoreScopedAndDepartureEditUsesJakartaDate() {
        when(requests.findByStatusOrderByCreatedAtAsc(DeliveryRescheduleRequest.Status.PENDING)).thenReturn(List.of(pending));
        assertEquals(1, service.pending(dispatcher).size());
        var other = new SmsUserPrincipal(UUID.randomUUID(), UUID.randomUUID(), Set.of(), Set.of());
        assertTrue(service.pending(other).isEmpty());
        service.schedule(original.getId(), Instant.parse("2026-11-02T20:00:00Z"), dispatcher);
        assertEquals(LocalDate.of(2026, 11, 3), original.getScheduledDate());
        original.setStatus(DeliveryTripStatus.DISPATCHED);
        assertThrows(BusinessRuleException.class, () -> service.schedule(original.getId(), now.plus(48, ChronoUnit.HOURS), dispatcher));
    }
}
