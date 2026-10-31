package com.sms.inventory;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sms.common.web.BusinessRuleException;
import com.sms.foundation.employee.Employee;
import com.sms.foundation.employee.EmployeeRepository;
import com.sms.foundation.employee.EmployeeRoleRepository;
import com.sms.foundation.employee.EmploymentStatus;
import com.sms.foundation.notification.NotificationService;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class StocktakeServiceTest {

    private final StocktakeSessionRepository sessionRepository = mock(StocktakeSessionRepository.class);
    private final StockUnitRepository stockUnitRepository = mock(StockUnitRepository.class);
    private final StoreRepository storeRepository = mock(StoreRepository.class);
    private final EmployeeRepository employeeRepository = mock(EmployeeRepository.class);
    private final EmployeeRoleRepository employeeRoleRepository = mock(EmployeeRoleRepository.class);
    private final NotificationService notificationService = mock(NotificationService.class);
    private StocktakeService service;

    @BeforeEach
    void setUp() {
        service = new StocktakeService(
                sessionRepository,
                stockUnitRepository,
                storeRepository,
                employeeRepository,
                employeeRoleRepository,
                notificationService);
    }

    @Test
    void submitFlagsMissingAndUnexpectedUnitsWithoutChangingInventory() {
        UUID sessionId = UUID.randomUUID();
        UUID storeId = UUID.randomUUID();
        StocktakeSession session = new StocktakeSession();
        Store store = mock(Store.class);
        when(store.getId()).thenReturn(storeId);
        session.setStore(store);
        session.setStatus(StocktakeStatus.OPEN);

        StocktakeCountLine expected = new StocktakeCountLine();
        expected.setSession(session);
        expected.setStockUnit(mock(StockUnit.class));
        expected.setScanCode("UNIT-1");
        expected.setExpected(true);
        session.getLines().add(expected);
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(sessionRepository.save(any(StocktakeSession.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(employeeRoleRepository.findEmployeeIdsByStoreAndPermission(
                storeId, "INVENTORY_MANAGE", EmploymentStatus.ACTIVE))
                .thenReturn(List.of());

        StocktakeSessionResponse result = service.submit(
                sessionId, List.of("UNIT-1", "UNKNOWN-1"));

        assertEquals(StocktakeStatus.PENDING_REVIEW, result.status());
        assertNull(result.expectedCount());
        assertNull(result.countedCount());
        assertNull(result.varianceCount());
        assertEquals(0, result.lines().size());
        assertEquals(2, session.getLines().size());
        assertEquals(StocktakeVariance.MATCH, expected.getVariance());
        assertEquals(StocktakeVariance.UNEXPECTED, session.getLines().get(1).getVariance());
    }

    @Test
    void submitRejectsDuplicateSerials() {
        UUID sessionId = UUID.randomUUID();
        StocktakeSession session = new StocktakeSession();
        session.setStatus(StocktakeStatus.OPEN);
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        assertThrows(
                BusinessRuleException.class,
                () -> service.submit(sessionId, List.of("UNIT-1", "UNIT-1")));
    }

    @Test
    void reviewRecordsDecisionWithoutInventoryAdjustment() {
        UUID sessionId = UUID.randomUUID();
        UUID reviewerId = UUID.randomUUID();
        StocktakeSession session = new StocktakeSession();
        session.setStatus(StocktakeStatus.PENDING_REVIEW);
        session.setStore(mock(Store.class));
        Employee reviewer = new Employee();
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(employeeRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
        when(sessionRepository.save(any(StocktakeSession.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        StocktakeSessionResponse result =
                service.review(sessionId, reviewerId, true, "Count verified");

        assertEquals(StocktakeStatus.REVIEWED, result.status());
        assertEquals("Count verified", result.reviewComment());
        verify(stockUnitRepository, org.mockito.Mockito.never()).save(any());
    }
}
