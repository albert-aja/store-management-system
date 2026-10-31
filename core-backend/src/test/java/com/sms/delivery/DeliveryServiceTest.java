package com.sms.delivery;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sms.common.web.BusinessRuleException;
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
import com.sms.sales.SalesOrderItem;
import com.sms.sales.SalesOrderRepository;
import com.sms.sales.SalesOrderStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

class DeliveryServiceTest {

    private final DeliveryTripRepository tripRepository = mock(DeliveryTripRepository.class);
    private final DeliveryOrderRepository deliveryOrderRepository = mock(DeliveryOrderRepository.class);
    private final DeliveryItemRepository deliveryItemRepository = mock(DeliveryItemRepository.class);
    private final StoreRepository storeRepository = mock(StoreRepository.class);
    private final EmployeeRepository employeeRepository = mock(EmployeeRepository.class);
    private final SalesOrderRepository salesOrderRepository = mock(SalesOrderRepository.class);
    private final SalesOrderItemStockUnitRepository allocationRepository = mock(SalesOrderItemStockUnitRepository.class);
    private final StockUnitRepository stockUnitRepository = mock(StockUnitRepository.class);
    private final StockMovementRepository stockMovementRepository = mock(StockMovementRepository.class);
    private final DocumentNumberingService numberingService = mock(DocumentNumberingService.class);
    private final EmployeeRoleRepository employeeRoleRepository = mock(EmployeeRoleRepository.class);
    private final NotificationService notificationService = mock(NotificationService.class);

    private DeliveryService service;

    @BeforeEach
    void setUp() {
        service = new DeliveryService(
                tripRepository,
                deliveryOrderRepository,
                deliveryItemRepository,
                storeRepository,
                employeeRepository,
                salesOrderRepository,
                allocationRepository,
                stockUnitRepository,
                stockMovementRepository,
                numberingService,
                employeeRoleRepository,
                notificationService
        );
    }

    @Test
    void createOrderPersistsDestinationGpsAndExposesItToDrivers() {
        UUID salesOrderId = UUID.randomUUID();
        UUID storeId = UUID.randomUUID();
        UUID allocationId = UUID.randomUUID();
        Store store = new Store();
        ReflectionTestUtils.setField(store, "id", storeId);
        SalesOrder so = new SalesOrder();
        ReflectionTestUtils.setField(so, "id", salesOrderId);
        so.setStore(store);
        so.setStatus(SalesOrderStatus.RELEASED);
        SalesOrderItem soItem = new SalesOrderItem();
        soItem.setSalesOrder(so);
        SalesOrderItemStockUnit allocation = new SalesOrderItemStockUnit();
        allocation.setSalesOrderItem(soItem);
        when(salesOrderRepository.findById(salesOrderId)).thenReturn(Optional.of(so));
        when(allocationRepository.findById(allocationId)).thenReturn(Optional.of(allocation));
        when(numberingService.nextNumber(storeId, "DO")).thenReturn("DO-GPS");
        when(deliveryOrderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var request = new CreateDeliveryOrderRequest(
                salesOrderId, null, "Verified destination", "Recipient", "Phone",
                1, BigDecimal.ZERO, null, List.of(allocationId), -6.2, 106.8);

        DeliveryOrder order = service.createDeliveryOrder(request);
        assertEquals(-6.2, order.getDestinationLatitude());
        assertEquals(106.8, order.getDestinationLongitude());
        order.setItems(List.of());
        DeliveryOrderResponse response = DeliveryOrderResponse.from(order);
        assertEquals(-6.2, response.destinationLatitude());
        assertEquals(106.8, response.destinationLongitude());
    }

    @Test
    void createOrderRejectsIncompleteOutOfRangeAndNonFiniteGps() {
        Double[][] invalidPairs = {
                {1.0, null}, {null, 1.0}, {90.1, 0.0}, {0.0, -180.1},
                {Double.NaN, 0.0}, {0.0, Double.POSITIVE_INFINITY}
        };
        for (Double[] pair : invalidPairs) {
            var request = new CreateDeliveryOrderRequest(
                    UUID.randomUUID(), null, "Destination", null, null,
                    null, null, null, List.of(UUID.randomUUID()), pair[0], pair[1]);
            assertThrows(BusinessRuleException.class, () -> service.createDeliveryOrder(request));
        }
    }

    @Test
    void responseKeepsLegacyDestinationsWithoutInventingGps() {
        DeliveryOrderResponse response = DeliveryOrderResponse.from(new DeliveryOrder());
        assertEquals(null, response.destinationLatitude());
        assertEquals(null, response.destinationLongitude());
    }

    @Test
    void createTripGeneratesTripNumberAndSavesPlannedTrip() {
        UUID storeId = UUID.randomUUID();
        UUID driverId = UUID.randomUUID();

        Store store = new Store();
        store.setCode("JKT01");
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));

        Employee driver = new Employee();
        driver.setEmploymentStatus(EmploymentStatus.ACTIVE);
        when(employeeRepository.findById(driverId)).thenReturn(Optional.of(driver));

        when(numberingService.nextNumber(storeId, "TRIP")).thenReturn("TRIP/JKT01/10/2026/0001");
        when(tripRepository.save(any(DeliveryTrip.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateDeliveryTripRequest req = new CreateDeliveryTripRequest(
                storeId, driverId, null, "B 1234 CD", LocalDate.now(), "Morning run"
        );

        DeliveryTrip trip = service.createTrip(req);

        assertEquals("TRIP/JKT01/10/2026/0001", trip.getTripNumber());
        assertEquals(DeliveryTripStatus.PLANNED, trip.getStatus());
        assertEquals("B 1234 CD", trip.getVehiclePlate());
    }

    @Test
    void dispatchTripRequiresAllOrdersToPassPreInspection() {
        UUID tripId = UUID.randomUUID();
        DeliveryTrip trip = new DeliveryTrip();
        trip.setStatus(DeliveryTripStatus.PLANNED);
        when(tripRepository.findById(tripId)).thenReturn(Optional.of(trip));

        DeliveryOrder uninspectedOrder = new DeliveryOrder();
        uninspectedOrder.setStatus(DeliveryOrderStatus.PENDING);
        uninspectedOrder.setPreInspectionPassed(false);

        when(deliveryOrderRepository.findByDeliveryTripIdOrderByStopSequenceAsc(tripId))
                .thenReturn(List.of(uninspectedOrder));

        assertThrows(BusinessRuleException.class, () -> service.dispatchTrip(tripId));
    }

    @Test
    void verifyPackingAcceptsExactManifestSerials() {
        UUID orderId = UUID.randomUUID();
        DeliveryOrder order = pendingOrderWithSerial("SN-100");
        when(deliveryOrderRepository.findById(orderId)).thenReturn(Optional.of(order));

        DeliveryOrder result = service.verifyPacking(orderId, List.of("SN-100"));

        assertTrue(result.isPreInspectionPassed());
        assertEquals("Packing manifest barcode-verified (1 stock unit(s))",
                result.getPreInspectionNotes());
    }

    @Test
    void verifyPackingRejectsUnexpectedSerialsWithoutPassingInspection() {
        UUID orderId = UUID.randomUUID();
        DeliveryOrder order = pendingOrderWithSerial("SN-100");
        when(deliveryOrderRepository.findById(orderId)).thenReturn(Optional.of(order));

        assertThrows(
                BusinessRuleException.class,
                () -> service.verifyPacking(orderId, List.of("SN-OTHER")));

        assertFalse(order.isPreInspectionPassed());
    }

    private DeliveryOrder pendingOrderWithSerial(String serial) {
        StockUnit unit = new StockUnit();
        unit.setManufacturerSerial(serial);
        SalesOrderItemStockUnit allocation = new SalesOrderItemStockUnit();
        allocation.setStockUnit(unit);
        DeliveryItem item = new DeliveryItem();
        item.setSoItemStockUnit(allocation);
        DeliveryOrder order = new DeliveryOrder();
        order.setStatus(DeliveryOrderStatus.PENDING);
        order.setItems(List.of(item));
        return order;
    }

    @Test
    void dispatchTripMarksTripDispatchedAndOrdersInTransit() {
        UUID tripId = UUID.randomUUID();
        DeliveryTrip trip = new DeliveryTrip();
        trip.setStatus(DeliveryTripStatus.PLANNED);
        when(tripRepository.findById(tripId)).thenReturn(Optional.of(trip));

        DeliveryOrder order = new DeliveryOrder();
        order.setStatus(DeliveryOrderStatus.PENDING);
        order.setPreInspectionPassed(true);

        when(deliveryOrderRepository.findByDeliveryTripIdOrderByStopSequenceAsc(tripId))
                .thenReturn(List.of(order));

        DeliveryTrip dispatched = service.dispatchTrip(tripId);

        assertEquals(DeliveryTripStatus.DISPATCHED, dispatched.getStatus());
        assertNotNull(dispatched.getDepartedAt());
        assertEquals(DeliveryOrderStatus.IN_TRANSIT, order.getStatus());
    }

    @Test
    void deliverOrderUpdatesStockUnitLocationAndPostsDeliveryMovement() {
        UUID orderId = UUID.randomUUID();
        Store store = new Store();

        SalesOrder so = new SalesOrder();
        so.setStore(store);

        StockUnit unit = new StockUnit();
        unit.setCurrentStore(store);
        unit.setLocationType(StockLocationType.WAREHOUSE);
        unit.setAvailabilityStatus(StockAvailability.RESERVED);

        SalesOrderItemStockUnit allocation = new SalesOrderItemStockUnit();
        allocation.setStockUnit(unit);

        DeliveryItem item = new DeliveryItem();
        item.setSoItemStockUnit(allocation);
        item.setStatus(DeliveryItemStatus.PENDING);

        DeliveryOrder order = new DeliveryOrder();
        order.setDeliveryOrderNumber("DO/JKT01/10/2026/0005");
        order.setSalesOrder(so);
        order.setStatus(DeliveryOrderStatus.IN_TRANSIT);
        order.setItems(List.of(item));

        when(deliveryOrderRepository.findById(orderId)).thenReturn(Optional.of(order));

        CompleteDeliveryOrderRequest req = new CompleteDeliveryOrderRequest(
                "John Doe", "https://photo.url/signed.jpg", BigDecimal.valueOf(500000), "Cash received", "Smooth delivery"
        );

        DeliveryOrder result = service.deliverOrder(orderId, req);

        assertEquals(DeliveryOrderStatus.DELIVERED, result.getStatus());
        assertEquals("John Doe", result.getSignedBy());
        assertEquals(DeliveryItemStatus.DELIVERED, item.getStatus());

        // Verify stock unit updated
        assertEquals(StockLocationType.AT_CUSTOMER, unit.getLocationType());
        assertEquals(StockAvailability.UNAVAILABLE, unit.getAvailabilityStatus());
        verify(stockUnitRepository).save(unit);

        // Verify stock movement posted
        ArgumentCaptor<StockMovement> captor = ArgumentCaptor.forClass(StockMovement.class);
        verify(stockMovementRepository).save(captor.capture());
        StockMovement movement = captor.getValue();
        assertEquals(MovementType.DELIVERY, movement.getMovementType());
        assertEquals(unit, movement.getStockUnit());
        assertEquals(StockLocationType.AT_CUSTOMER, movement.getToLocationType());
        assertEquals("DELIVERY_ORDER", movement.getReferenceType());
    }

    @Test
    void failDeliveryOrderRetainsAllocationForRescheduling() {
        UUID orderId = UUID.randomUUID();
        DeliveryOrder order = new DeliveryOrder();
        order.setStatus(DeliveryOrderStatus.IN_TRANSIT);

        DeliveryItem item = new DeliveryItem();
        item.setStatus(DeliveryItemStatus.PENDING);
        order.setItems(List.of(item));

        when(deliveryOrderRepository.findById(orderId)).thenReturn(Optional.of(order));

        FailDeliveryOrderRequest req = new FailDeliveryOrderRequest("Customer unavailable", "Called 3 times", "https://storage.example.com/proof.jpg");

        DeliveryOrder result = service.failDeliveryOrder(orderId, req);

        assertEquals(DeliveryOrderStatus.FAILED, result.getStatus());
        assertEquals("Customer unavailable", result.getFailureReason());
        assertEquals("https://storage.example.com/proof.jpg", result.getProofPhotoUrl());
        assertEquals(DeliveryItemStatus.REJECTED, item.getStatus());
    }

    @Test
    void failDeliveryOrderNotifiesStoreDispatchersToReschedule() {
        UUID orderId = UUID.randomUUID();
        UUID storeId = UUID.randomUUID();
        UUID dispatcherId = UUID.randomUUID();
        Store store = mock(Store.class);
        when(store.getId()).thenReturn(storeId);
        SalesOrder salesOrder = new SalesOrder();
        salesOrder.setStore(store);

        DeliveryOrder order = new DeliveryOrder();
        ReflectionTestUtils.setField(order, "id", orderId);
        order.setDeliveryOrderNumber("DO-100");
        order.setSalesOrder(salesOrder);
        order.setStatus(DeliveryOrderStatus.IN_TRANSIT);
        order.setItems(List.of());
        when(deliveryOrderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(employeeRoleRepository.findEmployeeIdsByStoreAndPermission(
                storeId, "DELIVERY_MANAGE", EmploymentStatus.ACTIVE))
                .thenReturn(List.of(dispatcherId));

        service.failDeliveryOrder(orderId, new FailDeliveryOrderRequest("WRONG_ADDRESS", "Address missing"));

        verify(notificationService).create(
                "DELIVERY_ORDER",
                orderId,
                "Failed delivery requires rescheduling",
                "Delivery DO-100 failed: WRONG_ADDRESS. Reassign this order to a new trip.",
                List.of(dispatcherId));
        verify(employeeRoleRepository).findEmployeeIdsByStoreAndPermission(
                storeId, "DELIVERY_MANAGE", EmploymentStatus.ACTIVE);
    }
}
