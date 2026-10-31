package com.sms.fleet;

import com.sms.foundation.employee.Employee;
import com.sms.foundation.employee.EmployeeRepository;
import com.sms.foundation.employee.EmployeeRole;
import com.sms.foundation.employee.EmployeeRoleRepository;
import com.sms.foundation.role.Role;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FleetServiceTest {

    @Mock
    private VehicleRepository vehicleRepository;
    @Mock
    private BreakScheduleRepository breakScheduleRepository;
    @Mock
    private TrackingSessionRepository trackingSessionRepository;
    @Mock
    private TrackingSessionEventRepository trackingSessionEventRepository;
    @Mock
    private TrackingLocationRepository trackingLocationRepository;
    @Mock
    private LocationAccessAuditLogRepository locationAccessAuditLogRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private EmployeeRoleRepository employeeRoleRepository;
    @Mock
    private StoreRepository storeRepository;

    @InjectMocks
    private FleetService fleetService;

    private UUID employeeId;
    private Employee driverEmployee;
    private Employee salespersonEmployee;
    private Vehicle vehicle;

    @BeforeEach
    void setUp() {
        employeeId = UUID.randomUUID();

        driverEmployee = new Employee();
        ReflectionTestUtils.setField(driverEmployee, "id", employeeId);
        driverEmployee.setFullName("Budi Santoso");

        salespersonEmployee = new Employee();
        UUID salesId = UUID.randomUUID();
        ReflectionTestUtils.setField(salespersonEmployee, "id", salesId);
        salespersonEmployee.setFullName("Dewi Sartika");

        vehicle = new Vehicle();
        ReflectionTestUtils.setField(vehicle, "id", UUID.randomUUID());
        vehicle.setRegistrationNumber("B 1234 ABC");
        vehicle.setVehicleType(VehicleType.BLIND_VAN);
        vehicle.setBrandModel("Daihatsu Gran Max");
        vehicle.setStatus(VehicleStatus.AVAILABLE);
    }

    @Test
    void createVehicle_success() {
        CreateVehicleRequest req = new CreateVehicleRequest();
        req.setRegistrationNumber("B 9999 XYZ");
        req.setVehicleType(VehicleType.LIGHT_TRUCK_4W);
        req.setBrandModel("Isuzu Traga");
        req.setMaxPayloadKg(1500);

        when(vehicleRepository.findByRegistrationNumberIgnoreCase("B 9999 XYZ")).thenReturn(Optional.empty());
        when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(invocation -> {
            Vehicle v = invocation.getArgument(0);
            ReflectionTestUtils.setField(v, "id", UUID.randomUUID());
            return v;
        });

        VehicleDto result = fleetService.createVehicle(req);

        assertThat(result).isNotNull();
        assertThat(result.getRegistrationNumber()).isEqualTo("B 9999 XYZ");
        assertThat(result.getStatus()).isEqualTo(VehicleStatus.AVAILABLE);
        verify(vehicleRepository).save(any(Vehicle.class));
    }

    @Test
    void createVehicle_duplicatePlate_throwsException() {
        CreateVehicleRequest req = new CreateVehicleRequest();
        req.setRegistrationNumber("B 1234 ABC");
        req.setVehicleType(VehicleType.BLIND_VAN);
        req.setBrandModel("Daihatsu Gran Max");

        when(vehicleRepository.findByRegistrationNumberIgnoreCase("B 1234 ABC")).thenReturn(Optional.of(vehicle));

        assertThatThrownBy(() -> fleetService.createVehicle(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    void startTrackingSession_forDriver_success() {
        StartTrackingSessionRequest req = new StartTrackingSessionRequest();
        req.setEmployeeId(employeeId);
        req.setTaskType(TrackingTaskType.DELIVERY_TRIP);
        req.setTaskCode("TRIP-001");
        req.setVehicleId(vehicle.getId());

        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(driverEmployee));
        when(employeeRoleRepository.findByEmployeeId(employeeId)).thenReturn(List.of());
        when(vehicleRepository.findById(vehicle.getId())).thenReturn(Optional.of(vehicle));

        when(trackingSessionRepository.save(any(TrackingSession.class))).thenAnswer(inv -> {
            TrackingSession s = inv.getArgument(0);
            ReflectionTestUtils.setField(s, "id", UUID.randomUUID());
            return s;
        });

        TrackingSessionDto dto = fleetService.startTrackingSession(req);

        assertThat(dto).isNotNull();
        assertThat(dto.getStatus()).isEqualTo(TrackingSessionStatus.ACTIVE);
        assertThat(vehicle.getStatus()).isEqualTo(VehicleStatus.IN_USE);
        verify(trackingSessionEventRepository).save(any(TrackingSessionEvent.class));
    }

    @Test
    void startTrackingSession_forSalesperson_throwsException() {
        StartTrackingSessionRequest req = new StartTrackingSessionRequest();
        req.setEmployeeId(salespersonEmployee.getId());
        req.setTaskType(TrackingTaskType.DELIVERY_TRIP);

        Role role = new Role();
        role.setCode("SALESPERSON");
        EmployeeRole empRole = new EmployeeRole();
        empRole.setEmployee(salespersonEmployee);
        empRole.setRole(role);

        when(employeeRepository.findById(salespersonEmployee.getId())).thenReturn(Optional.of(salespersonEmployee));
        when(employeeRoleRepository.findByEmployeeId(salespersonEmployee.getId())).thenReturn(List.of(empRole));

        assertThatThrownBy(() -> fleetService.startTrackingSession(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Salespersons are explicitly excluded from GPS location tracking");
    }

    @Test
    void completeTrackingSession_releasesVehicle_success() {
        UUID sessionId = UUID.randomUUID();
        TrackingSession session = new TrackingSession();
        ReflectionTestUtils.setField(session, "id", sessionId);
        session.setEmployee(driverEmployee);
        session.setTaskType(TrackingTaskType.DELIVERY_TRIP);
        session.setVehicle(vehicle);
        vehicle.setStatus(VehicleStatus.IN_USE);
        session.setStatus(TrackingSessionStatus.ACTIVE);
        session.setStartTime(Instant.now().minusSeconds(3600));

        when(trackingSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(trackingSessionRepository.save(any(TrackingSession.class))).thenAnswer(inv -> inv.getArgument(0));

        TrackingSessionDto dto = fleetService.completeTrackingSession(sessionId);

        assertThat(dto.getStatus()).isEqualTo(TrackingSessionStatus.COMPLETED);
        assertThat(vehicle.getStatus()).isEqualTo(VehicleStatus.AVAILABLE);
        verify(vehicleRepository).save(vehicle);
        verify(trackingSessionEventRepository).save(any(TrackingSessionEvent.class));
    }

    @Test
    void ingestLocations_whenPaused_rejectsCoordinates() {
        UUID sessionId = UUID.randomUUID();
        TrackingSession session = new TrackingSession();
        ReflectionTestUtils.setField(session, "id", sessionId);
        session.setStatus(TrackingSessionStatus.PAUSED); // In scheduled break

        when(trackingSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        LocationIngestionRequest req = new LocationIngestionRequest();
        req.setPoints(List.of(
                LocationPointDto.builder()
                        .latitude(BigDecimal.valueOf(-6.20))
                        .longitude(BigDecimal.valueOf(106.81))
                        .recordedAt(Instant.now())
                        .build()
        ));

        int ingested = fleetService.ingestLocations(sessionId, req);

        assertThat(ingested).isEqualTo(0);
        verify(trackingLocationRepository, never()).saveAll(any());
    }

    @Test
    void getHistoricalRoute_logsAuditRecord_success() {
        UUID sessionId = UUID.randomUUID();
        UUID actorId = UUID.randomUUID();
        Employee actor = new Employee();
        ReflectionTestUtils.setField(actor, "id", actorId);
        actor.setFullName("Supervisor Rudi");

        TrackingSession session = new TrackingSession();
        ReflectionTestUtils.setField(session, "id", sessionId);
        session.setEmployee(driverEmployee);
        session.setTaskType(TrackingTaskType.DELIVERY_TRIP);
        session.setTaskCode("TRIP-101");
        session.setStatus(TrackingSessionStatus.COMPLETED);

        when(trackingSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(employeeRepository.findById(actorId)).thenReturn(Optional.of(actor));
        when(trackingLocationRepository.findByTrackingSessionIdOrderByRecordedAtAsc(sessionId)).thenReturn(List.of());
        when(trackingSessionEventRepository.findByTrackingSessionIdOrderByEventTimestampAsc(sessionId)).thenReturn(List.of());

        HistoricalRouteResponse res = fleetService.getHistoricalRoute(sessionId, actorId, "127.0.0.1", "TestAgent");

        assertThat(res).isNotNull();
        ArgumentCaptor<LocationAccessAuditLog> auditCaptor = ArgumentCaptor.forClass(LocationAccessAuditLog.class);
        verify(locationAccessAuditLogRepository).save(auditCaptor.capture());
        LocationAccessAuditLog audit = auditCaptor.getValue();
        assertThat(audit.getActorEmployee()).isEqualTo(actor);
        assertThat(audit.getQueryType()).isEqualTo(LocationAccessQueryType.HISTORICAL_ROUTE_PLAYBACK);
    }

    @Test
    void getFleetAnalytics_returnsMetricsAndEthicalNotice() {

        FleetAnalyticsDto analytics = fleetService.getFleetAnalytics(null, LocalDate.now().minusDays(7), LocalDate.now());

        assertThat(analytics).isNotNull();
        assertThat(analytics.getTotalDistanceKm()).isGreaterThan(0);
        assertThat(analytics.getCompletedDeliveriesCount()).isGreaterThan(0);
        assertThat(analytics.getEthicalDecisionNotice()).contains("STATUTORY & ETHICAL OPERATIONAL NOTICE");
        assertThat(analytics.getVehicleUtilization()).isNotEmpty();
        assertThat(analytics.getRoleProductivity()).isNotEmpty();
    }

    @Test
    void getMaintenanceAlerts_evaluatesVehiclesAndGeneratesAlerts() {
        Vehicle v1 = new Vehicle();
        v1.setRegistrationNumber("B 1111 AAA");
        v1.setBrandModel("Gran Max");
        v1.setVehicleType(VehicleType.BLIND_VAN);
        v1.setStnkExpiryDate(LocalDate.now().plusDays(15));
        v1.setKirExpiryDate(LocalDate.now().plusDays(40));
        v1.setOdometerKm(12000);
        v1.setLastServiceOdometerKm(0);
        v1.setServiceIntervalKm(10000);

        when(vehicleRepository.findAll()).thenReturn(List.of(v1));

        List<FleetMaintenanceAlertDto> alerts = fleetService.getMaintenanceAlerts(null);

        assertThat(alerts).isNotEmpty();
        assertThat(alerts).anyMatch(a -> a.getAlertType().equals("STNK_EXPIRING") && a.getDaysRemaining() == 15L);
        assertThat(alerts).anyMatch(a -> a.getAlertType().equals("SERVICE_DUE"));
    }
}

