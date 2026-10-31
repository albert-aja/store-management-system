package com.sms.fleet;

import com.sms.foundation.employee.Employee;
import com.sms.foundation.employee.EmployeeRepository;
import com.sms.foundation.employee.EmployeeRole;
import com.sms.foundation.employee.EmployeeRoleRepository;
import com.sms.foundation.role.Role;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import com.sms.foundation.notification.NotificationService;
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
    private VehiclePlateHistoryRepository vehiclePlateHistoryRepository;
    @Mock
    private VehicleServiceLogRepository vehicleServiceLogRepository;
    @Mock
    private VehicleMonthlyHealthCheckRepository vehicleMonthlyHealthCheckRepository;
    @Mock
    private DriverLicenseRepository driverLicenseRepository;
    @Mock
    private NotificationService notificationService;

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

    @Test
    void createVehicle_withDriverAssignmentAndTaxDueDate_success() {
        CreateVehicleRequest request = new CreateVehicleRequest();
        request.setRegistrationNumber("B 9999 XYZ");
        request.setVehicleType(VehicleType.LIGHT_TRUCK_4W);
        request.setBrandModel("Mitsubishi Canter 125 PS");
        request.setDriverEmployeeId(employeeId);
        request.setTaxDueDate(LocalDate.now().plusDays(20));

        when(vehicleRepository.findByRegistrationNumberIgnoreCase("B 9999 XYZ")).thenReturn(Optional.empty());
        when(vehicleRepository.existsByAssignedDriverId(employeeId)).thenReturn(false);
        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(driverEmployee));
        when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(invocation -> invocation.getArgument(0));

        VehicleDto result = fleetService.createVehicle(request);

        assertThat(result).isNotNull();
        assertThat(result.getRegistrationNumber()).isEqualTo("B 9999 XYZ");
        assertThat(result.getDriverEmployeeId()).isEqualTo(employeeId);
        assertThat(result.getDriverName()).isEqualTo("Budi Santoso");
        assertThat(result.getTaxDueDate()).isEqualTo(LocalDate.now().plusDays(20));
        assertThat(result.getTaxDueStatus()).isEqualTo("DUE_IN_ONE_MONTH");
        assertThat(result.getIsTaxDueInOneMonth()).isTrue();
    }

    @Test
    void assignDriver_enforcesOneToOneConstraint_throwsWhenDriverAlreadyAssigned() {
        UUID vehicleId = UUID.randomUUID();
        Vehicle v = new Vehicle();
        ReflectionTestUtils.setField(v, "id", vehicleId);
        v.setRegistrationNumber("B 1234 CD");

        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(v));
        when(vehicleRepository.existsByAssignedDriverIdAndIdNot(employeeId, vehicleId)).thenReturn(true);

        assertThatThrownBy(() -> fleetService.assignDriver(vehicleId, employeeId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Driver is already assigned to another vehicle");
    }

    @Test
    void changeLicensePlate_updatesRegistrationAndRecordsHistory() {
        UUID vehicleId = UUID.randomUUID();
        Vehicle v = new Vehicle();
        ReflectionTestUtils.setField(v, "id", vehicleId);
        v.setRegistrationNumber("B 1000 OLD");
        v.setStnkExpiryDate(LocalDate.now().plusDays(10));

        ChangeLicensePlateRequest req = ChangeLicensePlateRequest.builder()
                .newRegistrationNumber("B 2000 NEW")
                .changeDate(LocalDate.now())
                .reason("5_YEAR_STNK_RENEWAL")
                .notes("New 5-year plate issuance by Samsat")
                .newStnkExpiryDate(LocalDate.now().plusYears(5))
                .newTaxDueDate(LocalDate.now().plusYears(1))
                .build();

        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(v));
        when(vehicleRepository.findByRegistrationNumberIgnoreCase("B 2000 NEW")).thenReturn(Optional.empty());
        when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(invocation -> invocation.getArgument(0));

        VehicleDto result = fleetService.changeLicensePlate(vehicleId, req);

        assertThat(result.getRegistrationNumber()).isEqualTo("B 2000 NEW");
        assertThat(result.getStnkExpiryDate()).isEqualTo(LocalDate.now().plusYears(5));
        assertThat(result.getTaxDueDate()).isEqualTo(LocalDate.now().plusYears(1));
        verify(vehiclePlateHistoryRepository, times(1)).save(any(VehiclePlateHistory.class));
    }

    @Test
    void getMaintenanceAlerts_evaluatesOneMonthTaxDueDate() {
        Vehicle v = new Vehicle();
        v.setRegistrationNumber("B 5555 TAX");
        v.setBrandModel("Isuzu Giga");
        v.setVehicleType(VehicleType.MEDIUM_TRUCK_6W);
        v.setTaxDueDate(LocalDate.now().plusDays(25)); // Due in 25 days (within 1-month window)

        when(vehicleRepository.findAll()).thenReturn(List.of(v));

        List<FleetMaintenanceAlertDto> alerts = fleetService.getMaintenanceAlerts(null);

        assertThat(alerts).anyMatch(a -> a.getAlertType().equals("TAX_EXPIRING")
                && a.getDaysRemaining() == 25L
                && a.getTitle().contains("1-Month Window"));
    }

    @Test
    void createServiceLog_updatesVehicleOdometerAndLastServiceDate() {
        UUID vehicleId = UUID.randomUUID();
        Vehicle v = new Vehicle();
        ReflectionTestUtils.setField(v, "id", vehicleId);
        v.setRegistrationNumber("B 1111 SVC");
        v.setOdometerKm(45000);

        CreateVehicleServiceLogRequest req = CreateVehicleServiceLogRequest.builder()
                .serviceDate(LocalDate.now())
                .serviceType("ROUTINE_MAINTENANCE")
                .serviceCenter("Auto2000 Service Center")
                .invoiceNumber("INV-2026-001")
                .odometerKm(50000)
                .costAmount(new BigDecimal("2500000.00"))
                .partsReplaced("Engine oil, oil filter, air filter")
                .description("Routine 50k service")
                .build();

        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(v));
        when(vehicleServiceLogRepository.save(any(VehicleServiceLog.class))).thenAnswer(inv -> {
            VehicleServiceLog saved = inv.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", UUID.randomUUID());
            return saved;
        });
        when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(inv -> inv.getArgument(0));

        VehicleServiceLogDto result = fleetService.createServiceLog(vehicleId, req);

        assertThat(result.getOdometerKm()).isEqualTo(50000);
        assertThat(result.getCostAmount()).isEqualTo(new BigDecimal("2500000.00"));
        assertThat(v.getLastServiceDate()).isEqualTo(LocalDate.now());
        assertThat(v.getLastServiceOdometerKm()).isEqualTo(50000);
        assertThat(v.getOdometerKm()).isEqualTo(50000);
        verify(vehicleServiceLogRepository, times(1)).save(any(VehicleServiceLog.class));
        verify(vehicleRepository, times(1)).save(v);
    }

    @Test
    void createMonthlyHealthCheck_setsVehicleToMaintenanceWhenUnfit() {
        UUID vehicleId = UUID.randomUUID();
        Vehicle v = new Vehicle();
        ReflectionTestUtils.setField(v, "id", vehicleId);
        v.setRegistrationNumber("B 2222 CHK");
        v.setStatus(VehicleStatus.AVAILABLE);

        CreateVehicleMonthlyHealthCheckRequest req = CreateVehicleMonthlyHealthCheckRequest.builder()
                .checkDate(LocalDate.now())
                .checkMonth("2026-10")
                .overallRating("UNFIT_FOR_ROAD")
                .engineOilStatus("CRITICAL")
                .radiatorCoolantStatus("OK")
                .brakeFluidStatus("LEAKING")
                .brakeCondition("WORN_OUT")
                .frontTireCondition("BALD")
                .batteryCondition("WEAK")
                .headlampsAndSignalsStatus("DEFECTIVE")
                .actionRequired("Immediate brake pad and tire replacement required before next delivery")
                .inspectorName("Chief Inspector Rudi")
                .odometerReadingKm(62000)
                .build();

        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(v));
        when(vehicleMonthlyHealthCheckRepository.save(any(VehicleMonthlyHealthCheck.class))).thenAnswer(inv -> {
            VehicleMonthlyHealthCheck saved = inv.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", UUID.randomUUID());
            return saved;
        });
        when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(inv -> inv.getArgument(0));

        VehicleMonthlyHealthCheckDto result = fleetService.createMonthlyHealthCheck(vehicleId, req);

        assertThat(result.getOverallRating()).isEqualTo("UNFIT_FOR_ROAD");
        assertThat(v.getStatus()).isEqualTo(VehicleStatus.MAINTENANCE);
        verify(vehicleMonthlyHealthCheckRepository, times(1)).save(any(VehicleMonthlyHealthCheck.class));
        verify(vehicleRepository, times(1)).save(v);
    }

    @Test
    void getTruckTravelDistance_calculatesTripDistancesFromDeliverySessions() {
        UUID vehicleId = UUID.randomUUID();
        Vehicle v = new Vehicle();
        ReflectionTestUtils.setField(v, "id", vehicleId);
        v.setRegistrationNumber("B 3333 DST");
        v.setOdometerKm(75000);
        v.setLastServiceOdometerKm(70000);

        TrackingSession s1 = new TrackingSession();
        ReflectionTestUtils.setField(s1, "id", UUID.randomUUID());
        s1.setVehicle(v);
        s1.setTaskCode("TASK-DELIVERY-101");
        s1.setStatus(TrackingSessionStatus.COMPLETED);
        s1.setTotalDistanceMeters(new BigDecimal("125400")); // 125.4 km
        s1.setStartTime(Instant.now().minusSeconds(3600 * 5));
        s1.setEndTime(Instant.now().minusSeconds(3600 * 2));

        TrackingSession s2 = new TrackingSession();
        ReflectionTestUtils.setField(s2, "id", UUID.randomUUID());
        s2.setVehicle(v);
        s2.setStatus(TrackingSessionStatus.COMPLETED);
        s2.setTotalDistanceMeters(new BigDecimal("45600")); // 45.6 km
        s2.setStartTime(Instant.now().minusSeconds(86400 * 2));
        s2.setEndTime(Instant.now().minusSeconds(86400 * 2 - 3600));

        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(v));
        when(trackingSessionRepository.findByVehicleIdOrderByStartTimeDesc(vehicleId)).thenReturn(List.of(s1, s2));

        TruckTravelDistanceDto distance = fleetService.getTruckTravelDistance(vehicleId);

        assertThat(distance.getRegistrationNumber()).isEqualTo("B 3333 DST");
        assertThat(distance.getTotalDeliveryDistanceKm()).isEqualTo(new BigDecimal("171.00"));
        assertThat(distance.getCompletedDeliveryTripsCount()).isEqualTo(2L);
        assertThat(distance.getOdometerSinceLastServiceKm()).isEqualTo(5000);
        assertThat(distance.getRecentTrips()).hasSize(2);
        assertThat(distance.getRecentTrips().get(0).getTaskCode()).isEqualTo("TASK-DELIVERY-101");
        assertThat(distance.getRecentTrips().get(0).getDistanceKm()).isEqualTo(new BigDecimal("125.40"));
    }

    @Test
    void createDriverLicense_savesAndDispatchesNotificationIfExpiringSoon() {
        Employee driver = new Employee();
        ReflectionTestUtils.setField(driver, "id", employeeId);
        driver.setFullName("Budi Supir");
        driver.setEmployeeNumber("DRV-101");

        CreateDriverLicenseRequest req = CreateDriverLicenseRequest.builder()
                .licenseNumber("SIM-987654321")
                .licenseType(DriverLicenseType.SIM_B1_UMUM)
                .issueDate(LocalDate.now().minusYears(5).plusDays(10))
                .expiryDate(LocalDate.now().plusDays(10)) // Expiring in 10 days
                .issuingPoliceOffice("Satpas Daan Mogot")
                .notes("Commercial heavy truck license")
                .build();

        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(driver));
        when(driverLicenseRepository.findByEmployeeIdAndLicenseType(employeeId, DriverLicenseType.SIM_B1_UMUM))
                .thenReturn(Optional.empty());
        when(driverLicenseRepository.save(any(DriverLicense.class))).thenAnswer(inv -> {
            DriverLicense saved = inv.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", UUID.randomUUID());
            return saved;
        });
        when(driverLicenseRepository.findById(any(UUID.class))).thenAnswer(inv -> {
            DriverLicense lic = new DriverLicense();
            ReflectionTestUtils.setField(lic, "id", inv.getArgument(0));
            lic.setEmployee(driver);
            lic.setLicenseNumber("SIM-987654321");
            lic.setLicenseType(DriverLicenseType.SIM_B1_UMUM);
            lic.setExpiryDate(LocalDate.now().plusDays(10));
            return Optional.of(lic);
        });

        DriverLicenseDto result = fleetService.createDriverLicense(employeeId, req);

        assertThat(result.getLicenseNumber()).isEqualTo("SIM-987654321");
        assertThat(result.getLicenseType()).isEqualTo(DriverLicenseType.SIM_B1_UMUM);
        assertThat(result.getStatus()).isEqualTo("EXPIRING_SOON");
        assertThat(result.getDaysRemaining()).isEqualTo(10L);
        // Proactive notification dispatched because license expires within 30 days
        verify(notificationService, atLeastOnce()).create(
                eq("DRIVER_LICENSE"), any(UUID.class), contains("Budi Supir"), contains("SIM"), eq(List.of(employeeId))
        );
    }

    @Test
    void scanAndNotifyExpiringLicenses_notifiesDriversWithin30Days() {
        Employee driver = new Employee();
        UUID drvId = UUID.randomUUID();
        ReflectionTestUtils.setField(driver, "id", drvId);
        driver.setFullName("Agus Pengemudi");

        DriverLicense lic = new DriverLicense();
        ReflectionTestUtils.setField(lic, "id", UUID.randomUUID());
        lic.setEmployee(driver);
        lic.setLicenseNumber("SIM-11223344");
        lic.setLicenseType(DriverLicenseType.SIM_B1_UMUM);
        lic.setExpiryDate(LocalDate.now().plusDays(15)); // 15 days remaining

        when(driverLicenseRepository.findByExpiryDateLessThanEqual(any(LocalDate.class)))
                .thenReturn(List.of(lic));
        when(driverLicenseRepository.save(any(DriverLicense.class))).thenAnswer(inv -> inv.getArgument(0));

        int sent = fleetService.scanAndNotifyExpiringLicenses();

        assertThat(sent).isEqualTo(1);
        assertThat(lic.getLastNotificationSentAt()).isNotNull();
        verify(notificationService, times(1)).create(
                eq("DRIVER_LICENSE"), eq(lic.getId()), contains("Agus Pengemudi"), contains("15 hari"), eq(List.of(drvId))
        );
    }

    @Test
    void sendLicenseRenewalReminder_createsManualReminderNotification() {
        Employee driver = new Employee();
        UUID drvId = UUID.randomUUID();
        ReflectionTestUtils.setField(driver, "id", drvId);
        driver.setFullName("Cecep Santoso");

        UUID licId = UUID.randomUUID();
        DriverLicense lic = new DriverLicense();
        ReflectionTestUtils.setField(lic, "id", licId);
        lic.setEmployee(driver);
        lic.setLicenseNumber("SIM-55667788");
        lic.setLicenseType(DriverLicenseType.SIM_B1);
        lic.setExpiryDate(LocalDate.now().plusDays(5));

        when(driverLicenseRepository.findById(licId)).thenReturn(Optional.of(lic));
        when(driverLicenseRepository.save(any(DriverLicense.class))).thenAnswer(inv -> inv.getArgument(0));

        DriverLicenseDto dto = fleetService.sendLicenseRenewalReminder(licId);

        assertThat(dto.getLicenseNumber()).isEqualTo("SIM-55667788");
        assertThat(dto.getStatus()).isEqualTo("EXPIRING_SOON");
        verify(notificationService, times(1)).create(
                eq("DRIVER_LICENSE"), eq(licId), contains("Cecep Santoso"), contains("5 hari"), eq(List.of(drvId))
        );
    }
}
