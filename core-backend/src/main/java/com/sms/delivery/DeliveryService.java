package com.sms.delivery;

import com.sms.common.web.BusinessRuleException;
import com.sms.common.web.NotFoundException;
import com.sms.foundation.employee.Employee;
import com.sms.foundation.employee.EmployeeRepository;
import com.sms.foundation.employee.EmployeeRoleRepository;
import com.sms.foundation.employee.EmploymentStatus;
import com.sms.foundation.numbering.DocumentNumberingService;
import com.sms.foundation.notification.NotificationService;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import com.sms.inventory.MovementType;
import com.sms.inventory.SalesOrderItemStockUnit;
import com.sms.inventory.SalesOrderItemStockUnitRepository;
import com.sms.inventory.StockAvailability;
import com.sms.inventory.StockLocationType;
import com.sms.inventory.StockMovement;
import com.sms.inventory.StockMovementRepository;
import com.sms.inventory.StockUnit;
import com.sms.inventory.StockUnitRepository;
import com.sms.sales.SalesOrder;
import com.sms.sales.SalesOrderRepository;
import com.sms.sales.SalesOrderStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class DeliveryService {

    private final DeliveryTripRepository tripRepository;
    private final DeliveryOrderRepository deliveryOrderRepository;
    private final DeliveryItemRepository deliveryItemRepository;
    private final StoreRepository storeRepository;
    private final EmployeeRepository employeeRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final SalesOrderItemStockUnitRepository allocationRepository;
    private final StockUnitRepository stockUnitRepository;
    private final StockMovementRepository stockMovementRepository;
    private final DocumentNumberingService numberingService;
    private final EmployeeRoleRepository employeeRoleRepository;
    private final NotificationService notificationService;

    // ── Delivery Trips ────────────────────────────────────────────────────────

    public DeliveryTrip createTrip(CreateDeliveryTripRequest request) {
        Store store = storeRepository.findById(request.storeId())
                .orElseThrow(() -> new NotFoundException("Store not found: " + request.storeId()));

        Employee driver = employeeRepository.findById(request.driverEmployeeId())
                .orElseThrow(() -> new NotFoundException("Driver not found: " + request.driverEmployeeId()));
        if (driver.getEmploymentStatus() != EmploymentStatus.ACTIVE) {
            throw new BusinessRuleException("Assigned driver must be active");
        }

        Employee helper = null;
        if (request.helperEmployeeId() != null) {
            helper = employeeRepository.findById(request.helperEmployeeId())
                    .orElseThrow(() -> new NotFoundException("Helper not found: " + request.helperEmployeeId()));
            if (helper.getEmploymentStatus() != EmploymentStatus.ACTIVE) {
                throw new BusinessRuleException("Assigned helper must be active");
            }
        }

        String tripNumber = numberingService.nextNumber(request.storeId(), "TRIP");

        DeliveryTrip trip = new DeliveryTrip();
        trip.setTripNumber(tripNumber);
        trip.setStore(store);
        trip.setDriver(driver);
        trip.setHelper(helper);
        trip.setVehiclePlate(request.vehiclePlate());
        trip.setScheduledDate(request.scheduledDate() != null ? request.scheduledDate() : LocalDate.now());
        if (request.plannedDispatchAt() != null) {
            LocalDate dispatchDate = request.plannedDispatchAt().atZone(DeliveryWindow.ZONE).toLocalDate();
            if (request.scheduledDate() != null && !request.scheduledDate().equals(dispatchDate)) {
                throw new BusinessRuleException("Planned dispatch must match the scheduled date in Asia/Jakarta");
            }
            trip.setScheduledDate(dispatchDate);
            trip.setPlannedDispatchAt(request.plannedDispatchAt());
        }
        trip.setStatus(DeliveryTripStatus.PLANNED);
        trip.setNotes(request.notes());
        return tripRepository.save(trip);
    }

    @Transactional(readOnly = true)
    public DeliveryTrip getTrip(UUID id) {
        return tripRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Delivery Trip not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<DeliveryTrip> searchTrips(UUID storeId, DeliveryTripStatus status, UUID driverId) {
        return tripRepository.searchTrips(storeId, status, driverId);
    }

    public DeliveryTrip dispatchTrip(UUID tripId) {
        DeliveryTrip trip = getTrip(tripId);
        if (trip.getStatus() != DeliveryTripStatus.PLANNED) {
            throw new BusinessRuleException("Only PLANNED trips can be dispatched");
        }

        List<DeliveryOrder> orders = deliveryOrderRepository.findByDeliveryTripIdOrderByStopSequenceAsc(tripId);
        if (orders.isEmpty()) {
            throw new BusinessRuleException("Cannot dispatch a trip with no assigned delivery orders");
        }

        // Before departure, all delivery orders must have passed pre-delivery inspection (README 11.1 / 6.5)
        boolean allInspected = orders.stream().allMatch(DeliveryOrder::isPreInspectionPassed);
        if (!allInspected) {
            throw new BusinessRuleException("All delivery orders on this trip must pass pre-delivery inspection before departure");
        }

        trip.setStatus(DeliveryTripStatus.DISPATCHED);
        trip.setDepartedAt(Instant.now());

        for (DeliveryOrder order : orders) {
            if (order.getStatus() == DeliveryOrderStatus.PENDING) {
                order.setStatus(DeliveryOrderStatus.IN_TRANSIT);
            }
        }

        return trip;
    }

    public DeliveryTrip completeTrip(UUID tripId, String notes) {
        DeliveryTrip trip = getTrip(tripId);
        if (trip.getStatus() != DeliveryTripStatus.DISPATCHED) {
            throw new BusinessRuleException("Only DISPATCHED trips can be completed");
        }

        List<DeliveryOrder> orders = deliveryOrderRepository.findByDeliveryTripIdOrderByStopSequenceAsc(tripId);
        // All orders must be in a terminal state before trip reconciliation/closure (README 11.3)
        boolean hasPending = orders.stream()
                .anyMatch(o -> o.getStatus() == DeliveryOrderStatus.PENDING || o.getStatus() == DeliveryOrderStatus.IN_TRANSIT);
        if (hasPending) {
            throw new BusinessRuleException("All delivery orders must be marked DELIVERED, FAILED, or CANCELLED before completing the trip");
        }

        trip.setStatus(DeliveryTripStatus.COMPLETED);
        trip.setCompletedAt(Instant.now());
        if (notes != null) {
            trip.setNotes(trip.getNotes() != null ? trip.getNotes() + " | Reconciled: " + notes : notes);
        }
        return trip;
    }

    public DeliveryTrip cancelTrip(UUID tripId, String reason) {
        DeliveryTrip trip = getTrip(tripId);
        if (trip.getStatus() != DeliveryTripStatus.PLANNED) {
            throw new BusinessRuleException("Only PLANNED trips can be cancelled");
        }

        List<DeliveryOrder> orders = deliveryOrderRepository.findByDeliveryTripIdOrderByStopSequenceAsc(tripId);
        for (DeliveryOrder order : orders) {
            order.setDeliveryTrip(null);
            order.setStatus(DeliveryOrderStatus.PENDING);
        }

        trip.setStatus(DeliveryTripStatus.CANCELLED);
        if (reason != null) {
            trip.setNotes(trip.getNotes() != null ? trip.getNotes() + " | Cancelled: " + reason : reason);
        }
        return trip;
    }

    // ── Delivery Orders ───────────────────────────────────────────────────────

    public DeliveryOrder createDeliveryOrder(CreateDeliveryOrderRequest request) {
        Double latitude = request.destinationLatitude();
        Double longitude = request.destinationLongitude();
        if ((latitude == null) != (longitude == null)
                || (latitude != null && (!Double.isFinite(latitude) || Math.abs(latitude) > 90
                || !Double.isFinite(longitude) || Math.abs(longitude) > 180))) {
            throw new BusinessRuleException("Destination GPS requires both latitude (-90 to 90) and longitude (-180 to 180)");
        }
        SalesOrder so = salesOrderRepository.findById(request.salesOrderId())
                .orElseThrow(() -> new NotFoundException("Sales Order not found: " + request.salesOrderId()));

        if (so.getStatus() != SalesOrderStatus.RELEASED && so.getStatus() != SalesOrderStatus.CONFIRMED) {
            throw new BusinessRuleException("Delivery orders can only be created for RELEASED or CONFIRMED sales orders");
        }

        DeliveryTrip trip = null;
        if (request.deliveryTripId() != null) {
            trip = getTrip(request.deliveryTripId());
            if (trip.getStatus() != DeliveryTripStatus.PLANNED) {
                throw new BusinessRuleException("Delivery orders can only be added to a PLANNED trip");
            }
        }

        String destination = request.destinationAddress();
        if (destination == null || destination.isBlank()) {
            destination = so.getDeliveryAddressSnapshot();
        }
        if (destination == null || destination.isBlank()) {
            throw new BusinessRuleException("Destination address is required");
        }

        String recipientName = request.recipientName();
        if (recipientName == null || recipientName.isBlank()) {
            recipientName = so.getCustomer().getFullName();
        }

        String recipientPhone = request.recipientPhone();
        if (recipientPhone == null || recipientPhone.isBlank()) {
            recipientPhone = so.getCustomer().getPrimaryPhone();
        }

        String doNumber = numberingService.nextNumber(so.getStore().getId(), "DO");

        DeliveryOrder order = new DeliveryOrder();
        order.setDeliveryOrderNumber(doNumber);
        order.setSalesOrder(so);
        order.setDeliveryTrip(trip);
        order.setDestinationAddress(destination);
        order.setDestinationLatitude(latitude);
        order.setDestinationLongitude(longitude);
        order.setRecipientName(recipientName);
        order.setRecipientPhone(recipientPhone);
        order.setStopSequence(request.stopSequence() != null ? request.stopSequence() : 1);
        order.setStatus(DeliveryOrderStatus.PENDING);
        order.setCodAmount(request.codAmount() != null ? request.codAmount() : BigDecimal.ZERO);
        order.setNotes(request.notes());

        List<DeliveryItem> items = new ArrayList<>();
        for (UUID allocationId : request.soItemStockUnitIds()) {
            SalesOrderItemStockUnit allocation = allocationRepository.findById(allocationId)
                    .orElseThrow(() -> new NotFoundException("Stock unit allocation not found: " + allocationId));

            if (!allocation.getSalesOrderItem().getSalesOrder().getId().equals(so.getId())) {
                throw new BusinessRuleException("Allocated stock unit does not belong to this sales order");
            }
            if (allocation.getReleasedAt() != null) {
                throw new BusinessRuleException("Cannot deliver an allocation that has been released");
            }
            if (deliveryItemRepository.isStockUnitInActiveDelivery(allocationId)) {
                throw new BusinessRuleException("Stock unit is already assigned to an active delivery order: " + allocationId);
            }

            DeliveryItem item = new DeliveryItem();
            item.setDeliveryOrder(order);
            item.setSoItemStockUnit(allocation);
            item.setStatus(DeliveryItemStatus.PENDING);
            items.add(item);
        }

        order.setItems(items);
        return deliveryOrderRepository.save(order);
    }

    @Transactional(readOnly = true)
    public DeliveryOrder getDeliveryOrder(UUID id) {
        return deliveryOrderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Delivery Order not found: " + id));
    }

    @Transactional(readOnly = true)
    public UUID getStoreIdForOrder(UUID id) {
        return getDeliveryOrder(id).getSalesOrder().getStore().getId();
    }

    @Transactional(readOnly = true)
    public List<DeliveryOrder> searchDeliveryOrders(UUID salesOrderId, UUID tripId, DeliveryOrderStatus status) {
        return deliveryOrderRepository.searchOrders(salesOrderId, tripId, status);
    }

    @Transactional(readOnly = true)
    public List<DeliveryOrder> listByTrip(UUID tripId) {
        return deliveryOrderRepository.findByDeliveryTripIdOrderByStopSequenceAsc(tripId);
    }

    @Transactional(readOnly = true)
    public List<DeliveryOrder> listBySalesOrder(UUID salesOrderId) {
        return deliveryOrderRepository.findBySalesOrderIdOrderByCreatedAtDesc(salesOrderId);
    }

    @Transactional(readOnly = true)
    public List<DeliveryOrder> listPendingForPicking(UUID storeId) {
        return deliveryOrderRepository.findPendingForPicking(storeId, DeliveryOrderStatus.PENDING);
    }

    public DeliveryOrder verifyPacking(UUID orderId, List<String> scannedSerials) {
        DeliveryOrder order = getDeliveryOrder(orderId);
        if (order.getStatus() != DeliveryOrderStatus.PENDING) {
            throw new BusinessRuleException("Packing can only be verified while the order is PENDING");
        }
        if (order.getItems().isEmpty()) {
            throw new BusinessRuleException("Cannot verify packing without manifest items");
        }

        Set<String> scanned = new HashSet<>();
        for (String serial : scannedSerials) {
            if (serial == null || serial.isBlank()) {
                throw new BusinessRuleException("Scanned serials must not be blank");
            }
            if (!scanned.add(serial.trim())) {
                throw new BusinessRuleException("Duplicate scanned serial: " + serial.trim());
            }
        }
        Set<String> expected = new HashSet<>();
        for (DeliveryItem item : order.getItems()) {
            if (item.getSoItemStockUnit() == null || item.getSoItemStockUnit().getStockUnit() == null) {
                throw new BusinessRuleException("Manifest contains an item without an allocated stock unit");
            }
            var unit = item.getSoItemStockUnit().getStockUnit();
            String serial = unit.getManufacturerSerial();
            expected.add(serial == null || serial.isBlank() ? unit.getId().toString() : serial);
        }
        if (!scanned.equals(expected)) {
            Set<String> missing = new HashSet<>(expected);
            missing.removeAll(scanned);
            Set<String> unexpected = new HashSet<>(scanned);
            unexpected.removeAll(expected);
            throw new BusinessRuleException(
                    "Packing manifest mismatch. Missing: " + missing + "; unexpected: " + unexpected);
        }
        order.setPreInspectionPassed(true);
        order.setPreInspectionNotes("Packing manifest barcode-verified (" + expected.size() + " stock unit(s))");
        return order;
    }

    public DeliveryOrder recordPreInspection(UUID orderId, boolean passed, String notes) {
        DeliveryOrder order = getDeliveryOrder(orderId);
        if (order.getStatus() != DeliveryOrderStatus.PENDING) {
            throw new BusinessRuleException("Pre-inspection can only be updated while the order is PENDING");
        }
        order.setPreInspectionPassed(passed);
        order.setPreInspectionNotes(notes);
        return order;
    }

    public DeliveryOrder deliverOrder(UUID orderId, CompleteDeliveryOrderRequest request) {
        DeliveryOrder order = getDeliveryOrder(orderId);
        if (order.getStatus() != DeliveryOrderStatus.IN_TRANSIT && order.getStatus() != DeliveryOrderStatus.PENDING) {
            throw new BusinessRuleException("Only PENDING or IN_TRANSIT orders can be marked as delivered");
        }

        order.setStatus(DeliveryOrderStatus.DELIVERED);
        order.setDeliveredAt(Instant.now());
        order.setSignedBy(request.signedBy());
        order.setProofPhotoUrl(request.proofPhotoUrl());
        if (request.codCollected() != null) {
            order.setCodCollected(request.codCollected());
        }
        order.setCodNotes(request.codNotes());
        if (request.notes() != null) {
            order.setNotes(order.getNotes() != null ? order.getNotes() + " | " + request.notes() : request.notes());
        }

        // Only successful delivery causes physical stock movement out of active inventory (README 11.2)
        Store store = order.getSalesOrder().getStore();
        for (DeliveryItem item : order.getItems()) {
            item.setStatus(DeliveryItemStatus.DELIVERED);

            StockUnit unit = item.getSoItemStockUnit().getStockUnit();
            unit.setLocationType(StockLocationType.AT_CUSTOMER);
            unit.setAvailabilityStatus(StockAvailability.UNAVAILABLE);
            stockUnitRepository.save(unit);

            StockMovement movement = new StockMovement();
            movement.setMovementType(MovementType.DELIVERY);
            movement.setStockUnit(unit);
            movement.setQuantity(1);
            movement.setFromStore(store);
            movement.setFromLocationType(StockLocationType.WAREHOUSE);
            movement.setToLocationType(StockLocationType.AT_CUSTOMER);
            movement.setReferenceType("DELIVERY_ORDER");
            movement.setReferenceId(order.getId());
            movement.setNotes("Customer delivery confirmed (DO " + order.getDeliveryOrderNumber() + ")");
            stockMovementRepository.save(movement);
        }

        return order;
    }

    public DeliveryOrder failDeliveryOrder(UUID orderId, FailDeliveryOrderRequest request) {
        DeliveryOrder order = getDeliveryOrder(orderId);
        if (order.getStatus() != DeliveryOrderStatus.IN_TRANSIT && order.getStatus() != DeliveryOrderStatus.PENDING) {
            throw new BusinessRuleException("Only PENDING or IN_TRANSIT orders can be marked as failed");
        }

        order.setStatus(DeliveryOrderStatus.FAILED);
        order.setFailureReason(request.failureReason());
        if (request.proofPhotoUrl() != null && !request.proofPhotoUrl().isBlank()) {
            order.setProofPhotoUrl(request.proofPhotoUrl());
        }
        if (request.notes() != null) {
            order.setNotes(order.getNotes() != null ? order.getNotes() + " | " + request.notes() : request.notes());
        }

        // Items remain allocated to the customer's SO item for rescheduling; stock units remain at the store (README 11.1)
        for (DeliveryItem item : order.getItems()) {
            item.setStatus(DeliveryItemStatus.REJECTED);
            item.setRejectionReason(request.failureReason());
        }

        notifyDispatcher(order);
        return order;
    }

    private void notifyDispatcher(DeliveryOrder order) {
        if (order.getSalesOrder() == null || order.getSalesOrder().getStore() == null) return;
        UUID storeId = order.getSalesOrder().getStore().getId();
        List<UUID> dispatchers = employeeRoleRepository.findEmployeeIdsByStoreAndPermission(
                storeId, "DELIVERY_MANAGE", EmploymentStatus.ACTIVE);
        if (dispatchers.isEmpty()) return;
        notificationService.create(
                "DELIVERY_ORDER",
                order.getId(),
                "Failed delivery requires rescheduling",
                "Delivery " + order.getDeliveryOrderNumber() + " failed: "
                        + order.getFailureReason() + ". Reassign this order to a new trip.",
                dispatchers);
    }

    public DeliveryOrder cancelDeliveryOrder(UUID orderId, String reason) {
        DeliveryOrder order = getDeliveryOrder(orderId);
        if (order.getStatus() == DeliveryOrderStatus.DELIVERED) {
            throw new BusinessRuleException("Cannot cancel a completed delivery order");
        }

        order.setStatus(DeliveryOrderStatus.CANCELLED);
        if (reason != null) {
            order.setNotes(order.getNotes() != null ? order.getNotes() + " | Cancelled: " + reason : reason);
        }
        return order;
    }
}
