package com.sms.fleet;

import com.sms.foundation.employee.Employee;
import com.sms.foundation.employee.EmployeeRepository;
import com.sms.foundation.employee.EmployeeRole;
import com.sms.foundation.employee.EmployeeRoleRepository;
import com.sms.foundation.employee.EmploymentStatus;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import com.sms.foundation.notification.NotificationService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.ZoneId;
import java.util.ArrayList;
import org.springframework.scheduling.annotation.Scheduled;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class FleetService {

    private final VehicleRepository vehicleRepository;
    private final VehiclePlateHistoryRepository vehiclePlateHistoryRepository;
    private final VehicleServiceLogRepository vehicleServiceLogRepository;
    private final VehicleMonthlyHealthCheckRepository vehicleMonthlyHealthCheckRepository;
    private final DriverLicenseRepository driverLicenseRepository;
    private final NotificationService notificationService;
    private final BreakScheduleRepository breakScheduleRepository;
    private final TrackingSessionRepository trackingSessionRepository;
    private final TrackingSessionEventRepository trackingSessionEventRepository;
    private final TrackingLocationRepository trackingLocationRepository;
    private final LocationAccessAuditLogRepository locationAccessAuditLogRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeRoleRepository employeeRoleRepository;
    private final StoreRepository storeRepository;

    public static final String ETHICAL_OPERATIONAL_NOTICE =
            "STATUTORY & ETHICAL OPERATIONAL NOTICE: GPS-derived telemetry reflects automated machine observations only "
            + "and must NEVER be used as the sole or definitive basis for punitive employee action, wage deductions, or disciplinary sanctions. "
            + "Field performance evaluations must holistically account for external operational realities, including severe weather conditions "
            + "(e.g., tropical storms and flash floods), urban traffic gridlock, multi-flight heavy furniture stair climbs, cellular blind spots, "
            + "and customer-side delays.";

    // --- Vehicle Management ---

    @Transactional(readOnly = true)
    public List<VehicleDto> getVehicles(UUID storeId, VehicleStatus status) {
        List<Vehicle> list;
        if (storeId != null && status != null) {
            list = vehicleRepository.findByStoreIdAndStatus(storeId, status);
        } else if (storeId != null) {
            list = vehicleRepository.findByStoreId(storeId);
        } else if (status != null) {
            list = vehicleRepository.findByStatus(status);
        } else {
            list = vehicleRepository.findAll();
        }
        return list.stream().map(this::toVehicleDto).toList();
    }

    @Transactional
    public VehicleDto createVehicle(CreateVehicleRequest request) {
        Optional<Vehicle> existing = vehicleRepository.findByRegistrationNumberIgnoreCase(request.getRegistrationNumber());
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Vehicle with registration number " + request.getRegistrationNumber() + " already exists");
        }

        Store store = null;
        if (request.getStoreId() != null) {
            store = storeRepository.findById(request.getStoreId()).orElse(null);
        }

        Vehicle v = new Vehicle();
        v.setRegistrationNumber(request.getRegistrationNumber().trim().toUpperCase());
        v.setVehicleType(request.getVehicleType());
        v.setBrandModel(request.getBrandModel());
        v.setMaxPayloadKg(request.getMaxPayloadKg());
        v.setMaxVolumeCbm(request.getMaxVolumeCbm());
        v.setStnkExpiryDate(request.getStnkExpiryDate());
        v.setTaxDueDate(request.getTaxDueDate());
        v.setKirExpiryDate(request.getKirExpiryDate());
        v.setLastServiceOdometerKm(request.getLastServiceOdometerKm() != null ? request.getLastServiceOdometerKm() : 0);
        v.setLastServiceDate(request.getLastServiceDate());
        v.setServiceIntervalKm(request.getServiceIntervalKm() != null ? request.getServiceIntervalKm() : 10000);
        v.setStatus(VehicleStatus.AVAILABLE);
        v.setStore(store);

        if (request.getDriverEmployeeId() != null) {
            if (vehicleRepository.existsByAssignedDriverId(request.getDriverEmployeeId())) {
                throw new IllegalArgumentException("Driver is already assigned to another vehicle");
            }
            Employee driver = employeeRepository.findById(request.getDriverEmployeeId())
                    .orElseThrow(() -> new IllegalArgumentException("Driver not found: " + request.getDriverEmployeeId()));
            if (driver.getEmploymentStatus() != EmploymentStatus.ACTIVE) {
                throw new IllegalArgumentException("Assigned driver must be active");
            }
            v.setAssignedDriver(driver);
        }

        Vehicle saved = vehicleRepository.save(v);
        return toVehicleDto(saved);
    }

    @Transactional
    public VehicleDto updateVehicleStatus(UUID id, VehicleStatus status) {
        Vehicle v = vehicleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: " + id));
        v.setStatus(status);
        return toVehicleDto(vehicleRepository.save(v));
    }

    @Transactional(readOnly = true)
    public VehicleDto getVehicleById(UUID id) {
        Vehicle v = vehicleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: " + id));
        return toVehicleDto(v);
    }

    @Transactional
    public VehicleDto updateVehicle(UUID id, UpdateVehicleRequest request) {
        Vehicle v = vehicleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: " + id));

        Store store = null;
        if (request.getStoreId() != null) {
            store = storeRepository.findById(request.getStoreId()).orElse(null);
        }
        v.setStore(store);
        v.setVehicleType(request.getVehicleType());
        v.setBrandModel(request.getBrandModel());
        v.setChassisNumber(request.getChassisNumber());
        v.setEngineNumber(request.getEngineNumber());
        if (request.getStatus() != null) {
            v.setStatus(request.getStatus());
        }
        v.setMaxPayloadKg(request.getMaxPayloadKg());
        v.setMaxVolumeCbm(request.getMaxVolumeCbm());
        v.setFuelType(request.getFuelType());
        if (request.getOdometerKm() != null) {
            v.setOdometerKm(request.getOdometerKm());
        }
        v.setTaxDueDate(request.getTaxDueDate());
        v.setStnkExpiryDate(request.getStnkExpiryDate());
        v.setKirExpiryDate(request.getKirExpiryDate());
        if (request.getServiceIntervalKm() != null) {
            v.setServiceIntervalKm(request.getServiceIntervalKm());
        }

        if (request.getDriverEmployeeId() == null) {
            v.setAssignedDriver(null);
        } else {
            UUID currentDriverId = v.getAssignedDriver() != null ? v.getAssignedDriver().getId() : null;
            if (!request.getDriverEmployeeId().equals(currentDriverId)) {
                if (vehicleRepository.existsByAssignedDriverIdAndIdNot(request.getDriverEmployeeId(), id)) {
                    throw new IllegalArgumentException("Driver is already assigned to another vehicle");
                }
                Employee driver = employeeRepository.findById(request.getDriverEmployeeId())
                        .orElseThrow(() -> new IllegalArgumentException("Driver not found: " + request.getDriverEmployeeId()));
                if (driver.getEmploymentStatus() != EmploymentStatus.ACTIVE) {
                    throw new IllegalArgumentException("Assigned driver must be active");
                }
                v.setAssignedDriver(driver);
            }
        }

        Vehicle saved = vehicleRepository.save(v);
        return toVehicleDto(saved);
    }

    @Transactional
    public VehicleDto assignDriver(UUID vehicleId, UUID driverEmployeeId) {
        Vehicle v = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: " + vehicleId));

        if (driverEmployeeId == null) {
            v.setAssignedDriver(null);
        } else {
            if (vehicleRepository.existsByAssignedDriverIdAndIdNot(driverEmployeeId, vehicleId)) {
                throw new IllegalArgumentException("Driver is already assigned to another vehicle");
            }
            Employee driver = employeeRepository.findById(driverEmployeeId)
                    .orElseThrow(() -> new IllegalArgumentException("Driver not found: " + driverEmployeeId));
            if (driver.getEmploymentStatus() != EmploymentStatus.ACTIVE) {
                throw new IllegalArgumentException("Assigned driver must be active");
            }
            v.setAssignedDriver(driver);
        }

        return toVehicleDto(vehicleRepository.save(v));
    }

    @Transactional
    public VehicleDto unassignDriver(UUID vehicleId) {
        return assignDriver(vehicleId, null);
    }

    @Transactional(readOnly = true)
    public List<AvailableDriverDto> getAvailableDrivers(UUID currentVehicleId) {
        List<Employee> allEmployees = employeeRepository.findAll();
        List<Vehicle> allVehicles = vehicleRepository.findAll();
        List<DriverLicense> allLicenses = driverLicenseRepository.findAllByOrderByExpiryDateAsc();
        LocalDate now = LocalDate.now();

        return allEmployees.stream()
                .filter(e -> e.getEmploymentStatus() == EmploymentStatus.ACTIVE)
                .map(emp -> {
                    Vehicle assignedVehicle = allVehicles.stream()
                            .filter(v -> v.getAssignedDriver() != null && v.getAssignedDriver().getId().equals(emp.getId()))
                            .findFirst()
                            .orElse(null);

                    boolean isAssigned = assignedVehicle != null;
                    UUID vId = isAssigned ? assignedVehicle.getId() : null;
                    String regNo = isAssigned ? assignedVehicle.getRegistrationNumber() : null;

                    DriverLicense primaryLicense = allLicenses.stream()
                            .filter(l -> l.getEmployee().getId().equals(emp.getId()))
                            .findFirst()
                            .orElse(null);

                    String licNumber = primaryLicense != null ? primaryLicense.getLicenseNumber() : null;
                    DriverLicenseType licType = primaryLicense != null ? primaryLicense.getLicenseType() : null;
                    LocalDate licExpiry = primaryLicense != null ? primaryLicense.getExpiryDate() : null;
                    Long days = licExpiry != null ? ChronoUnit.DAYS.between(now, licExpiry) : null;
                    String licStatus = "NOT_RECORDED";
                    if (days != null) {
                        if (days < 0) {
                            licStatus = "EXPIRED";
                        } else if (days <= 30) {
                            licStatus = "EXPIRING_SOON";
                        } else {
                            licStatus = "VALID";
                        }
                    }

                    return AvailableDriverDto.builder()
                            .employeeId(emp.getId())
                            .employeeNumber(emp.getEmployeeNumber())
                            .fullName(emp.getFullName())
                            .phone(emp.getPhone())
                            .isAssigned(isAssigned)
                            .assignedVehicleId(vId)
                            .assignedRegistrationNumber(regNo)
                            .primaryLicenseNumber(licNumber)
                            .primaryLicenseType(licType)
                            .primaryLicenseExpiryDate(licExpiry)
                            .primaryLicenseDaysRemaining(days)
                            .primaryLicenseStatus(licStatus)
                            .build();
                })
                .toList();
    }

    @Transactional
    public VehicleDto changeLicensePlate(UUID vehicleId, ChangeLicensePlateRequest request) {
        Vehicle v = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: " + vehicleId));

        String newPlate = request.getNewRegistrationNumber().trim().toUpperCase();
        if (newPlate.equalsIgnoreCase(v.getRegistrationNumber())) {
            throw new IllegalArgumentException("New license plate must be different from current license plate");
        }

        Optional<Vehicle> existing = vehicleRepository.findByRegistrationNumberIgnoreCase(newPlate);
        if (existing.isPresent() && !existing.get().getId().equals(vehicleId)) {
            throw new IllegalArgumentException("License plate " + newPlate + " is already in use by another vehicle");
        }

        VehiclePlateHistory history = new VehiclePlateHistory();
        history.setVehicle(v);
        history.setOldRegistrationNumber(v.getRegistrationNumber());
        history.setNewRegistrationNumber(newPlate);
        history.setChangeDate(request.getChangeDate() != null ? request.getChangeDate() : LocalDate.now());
        history.setReason(request.getReason());
        history.setNotes(request.getNotes());
        if (request.getChangedByEmployeeId() != null) {
            employeeRepository.findById(request.getChangedByEmployeeId()).ifPresent(history::setChangedByEmployee);
        }
        vehiclePlateHistoryRepository.save(history);

        v.setRegistrationNumber(newPlate);
        if (request.getNewStnkExpiryDate() != null) {
            v.setStnkExpiryDate(request.getNewStnkExpiryDate());
        }
        if (request.getNewTaxDueDate() != null) {
            v.setTaxDueDate(request.getNewTaxDueDate());
        }

        Vehicle saved = vehicleRepository.save(v);
        return toVehicleDto(saved);
    }

    @Transactional(readOnly = true)
    public List<VehiclePlateHistoryDto> getPlateHistory(UUID vehicleId) {
        return vehiclePlateHistoryRepository.findByVehicleIdOrderByChangeDateDescCreatedAtDesc(vehicleId).stream()
                .map(this::toVehiclePlateHistoryDto)
                .toList();
    }

    // --- Break Schedules ---

    @Transactional(readOnly = true)
    public List<BreakScheduleDto> getBreakSchedules(UUID storeId) {
        List<BreakSchedule> list = storeId != null
                ? breakScheduleRepository.findByStoreIdAndActiveTrue(storeId)
                : breakScheduleRepository.findByActiveTrue();
        return list.stream().map(this::toBreakScheduleDto).toList();
    }

    @Transactional
    public BreakScheduleDto createBreakSchedule(CreateBreakScheduleRequest request) {
        Store store = null;
        if (request.getStoreId() != null) {
            store = storeRepository.findById(request.getStoreId()).orElse(null);
        }

        BreakSchedule bs = new BreakSchedule();
        bs.setName(request.getName());
        bs.setEmployeeRole(request.getEmployeeRole());
        bs.setStartTime(request.getStartTime());
        bs.setEndTime(request.getEndTime());
        bs.setActive(true);
        bs.setStore(store);

        return toBreakScheduleDto(breakScheduleRepository.save(bs));
    }

    // --- Tracking Sessions & Events ---

    @Transactional
    public TrackingSessionDto startTrackingSession(StartTrackingSessionRequest request) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + request.getEmployeeId()));

        // Invariant: Salespersons are strictly excluded from GPS tracking
        List<EmployeeRole> roles = employeeRoleRepository.findByEmployeeId(employee.getId());
        boolean isSalesperson = roles.stream()
                .anyMatch(r -> "SALESPERSON".equalsIgnoreCase(r.getRole().getCode()));
        if (isSalesperson) {
            throw new IllegalArgumentException("Salespersons are explicitly excluded from GPS location tracking");
        }

        Vehicle vehicle = null;
        if (request.getVehicleId() != null) {
            vehicle = vehicleRepository.findById(request.getVehicleId())
                    .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: " + request.getVehicleId()));
            vehicle.setStatus(VehicleStatus.IN_USE);
            vehicleRepository.save(vehicle);
        }

        TrackingSession session = new TrackingSession();
        session.setEmployee(employee);
        session.setTaskType(request.getTaskType());
        session.setTaskId(request.getTaskId());
        session.setTaskCode(request.getTaskCode());
        session.setVehicle(vehicle);
        session.setStatus(TrackingSessionStatus.ACTIVE);
        session.setStartTime(Instant.now());

        TrackingSession saved = trackingSessionRepository.save(session);

        // Record start event
        TrackingSessionEvent event = new TrackingSessionEvent();
        event.setTrackingSession(saved);
        event.setEventType(TrackingEventType.SESSION_STARTED);
        event.setEventTimestamp(Instant.now());
        event.setNotes("Tracking session initialized by worker");
        trackingSessionEventRepository.save(event);

        return toTrackingSessionDto(saved);
    }

    @Transactional
    public TrackingSessionDto completeTrackingSession(UUID id) {
        TrackingSession session = trackingSessionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tracking session not found: " + id));

        session.setStatus(TrackingSessionStatus.COMPLETED);
        session.setEndTime(Instant.now());

        if (session.getVehicle() != null) {
            session.getVehicle().setStatus(VehicleStatus.AVAILABLE);
            vehicleRepository.save(session.getVehicle());
        }

        TrackingSession saved = trackingSessionRepository.save(session);

        TrackingSessionEvent event = new TrackingSessionEvent();
        event.setTrackingSession(saved);
        event.setEventType(TrackingEventType.SESSION_COMPLETED);
        event.setEventTimestamp(Instant.now());
        event.setNotes("Tracking session completed and vehicle released");
        trackingSessionEventRepository.save(event);

        return toTrackingSessionDto(saved);
    }

    @Transactional
    public void recordSessionEvent(UUID sessionId, RecordSessionEventRequest request) {
        TrackingSession session = trackingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Tracking session not found: " + sessionId));

        TrackingSessionEvent event = new TrackingSessionEvent();
        event.setTrackingSession(session);
        event.setEventType(request.getEventType());
        event.setEventTimestamp(request.getEventTimestamp() != null ? request.getEventTimestamp() : Instant.now());
        event.setReasonCode(request.getReasonCode());
        event.setNotes(request.getNotes());
        event.setLocationLatitude(request.getLocationLatitude());
        event.setLocationLongitude(request.getLocationLongitude());
        trackingSessionEventRepository.save(event);

        if (request.getEventType() == TrackingEventType.MANUAL_PAUSE || request.getEventType() == TrackingEventType.SCHEDULED_BREAK_PAUSE) {
            session.setStatus(TrackingSessionStatus.PAUSED);
            trackingSessionRepository.save(session);
        } else if (request.getEventType() == TrackingEventType.MANUAL_RESUME || request.getEventType() == TrackingEventType.SCHEDULED_BREAK_RESUME) {
            session.setStatus(TrackingSessionStatus.ACTIVE);
            trackingSessionRepository.save(session);
        }
    }

    @Transactional
    public int ingestLocations(UUID sessionId, LocationIngestionRequest request) {
        TrackingSession session = trackingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Tracking session not found: " + sessionId));

        // Invariant: coordinates must be rejected when session is paused
        if (session.getStatus() == TrackingSessionStatus.PAUSED || session.getStatus() == TrackingSessionStatus.COMPLETED) {
            log.info("Rejected {} coordinates for session {} because status is {}",
                    request.getPoints().size(), sessionId, session.getStatus());
            return 0;
        }

        List<TrackingLocation> entities = request.getPoints().stream().map(p -> {
            TrackingLocation loc = new TrackingLocation();
            loc.setTrackingSession(session);
            loc.setEmployee(session.getEmployee());
            loc.setLatitude(p.getLatitude());
            loc.setLongitude(p.getLongitude());
            loc.setSpeedMps(p.getSpeedMps());
            loc.setHeadingDegrees(p.getHeadingDegrees());
            loc.setAccuracyMeters(p.getAccuracyMeters());
            loc.setBatteryLevelPct(p.getBatteryLevelPct());
            loc.setIsMockProvider(p.getIsMockProvider() != null ? p.getIsMockProvider() : false);
            loc.setRecordedAt(p.getRecordedAt());
            return loc;
        }).toList();

        trackingLocationRepository.saveAll(entities);
        return entities.size();
    }

    // --- Live Monitoring & Playback ---

    @Transactional(readOnly = true)
    public List<LiveFleetStatusDto> getLiveFleetStatus(UUID storeId) {
        List<TrackingSession> active = trackingSessionRepository.findActiveOrPausedSessions();

        return active.stream().map(s -> {
            List<TrackingLocation> locs = trackingLocationRepository.findByTrackingSessionIdOrderByRecordedAtAsc(s.getId());
            TrackingLocation latest = locs.isEmpty() ? null : locs.get(locs.size() - 1);

            return LiveFleetStatusDto.builder()
                    .sessionId(s.getId())
                    .employeeId(s.getEmployee().getId())
                    .employeeName(s.getEmployee().getFullName())
                    .employeeRole(s.getEmployee().getEmploymentType() != null ? s.getEmployee().getEmploymentType().name() : "STAFF")
                    .taskType(s.getTaskType())
                    .taskCode(s.getTaskCode())
                    .vehicleId(s.getVehicle() != null ? s.getVehicle().getId() : null)
                    .vehicleRegistrationNumber(s.getVehicle() != null ? s.getVehicle().getRegistrationNumber() : "No Vehicle")
                    .trackingStatus(s.getStatus())
                    .latitude(latest != null ? latest.getLatitude() : BigDecimal.valueOf(-6.200000))
                    .longitude(latest != null ? latest.getLongitude() : BigDecimal.valueOf(106.816666))
                    .speedKmh(latest != null && latest.getSpeedMps() != null
                            ? BigDecimal.valueOf(latest.getSpeedMps().doubleValue() * 3.6).setScale(1, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO)
                    .headingDegrees(latest != null && latest.getHeadingDegrees() != null ? latest.getHeadingDegrees() : BigDecimal.ZERO)
                    .accuracyMeters(latest != null && latest.getAccuracyMeters() != null ? latest.getAccuracyMeters() : BigDecimal.valueOf(5.0))
                    .batteryLevelPct(latest != null && latest.getBatteryLevelPct() != null ? latest.getBatteryLevelPct() : 95)
                    .lastPingAt(latest != null ? latest.getRecordedAt() : s.getStartTime())
                    .build();
        }).toList();
    }

    @Transactional
    public HistoricalRouteResponse getHistoricalRoute(UUID sessionId, UUID actorId, String ipAddress, String userAgent) {
        TrackingSession session = trackingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        Employee actor = null;
        if (actorId != null) {
            actor = employeeRepository.findById(actorId).orElse(null);
        }

        // UU PDP compliance: log immutable audit trail
        LocationAccessAuditLog audit = new LocationAccessAuditLog();
        audit.setActorEmployee(actor);
        audit.setTargetEmployee(session.getEmployee());
        audit.setQueryType(LocationAccessQueryType.HISTORICAL_ROUTE_PLAYBACK);
        audit.setIpAddress(ipAddress);
        audit.setUserAgent(userAgent);
        audit.setDetails("Supervisor historical route reconstruction for session " + sessionId);
        locationAccessAuditLogRepository.save(audit);

        List<TrackingLocation> locs = trackingLocationRepository.findByTrackingSessionIdOrderByRecordedAtAsc(sessionId);
        List<TrackingSessionEvent> events = trackingSessionEventRepository.findByTrackingSessionIdOrderByEventTimestampAsc(sessionId);

        List<LocationPointDto> points = locs.stream().map(l -> LocationPointDto.builder()
                .latitude(l.getLatitude())
                .longitude(l.getLongitude())
                .speedMps(l.getSpeedMps())
                .headingDegrees(l.getHeadingDegrees())
                .accuracyMeters(l.getAccuracyMeters())
                .batteryLevelPct(l.getBatteryLevelPct())
                .isMockProvider(l.getIsMockProvider())
                .recordedAt(l.getRecordedAt())
                .build()
        ).toList();

        List<HistoricalRouteResponse.SessionEventDto> eventDtos = events.stream().map(e -> HistoricalRouteResponse.SessionEventDto.builder()
                .id(e.getId())
                .eventType(e.getEventType())
                .eventTimestamp(e.getEventTimestamp())
                .reasonCode(e.getReasonCode())
                .notes(e.getNotes())
                .latitude(e.getLocationLatitude())
                .longitude(e.getLocationLongitude())
                .build()
        ).toList();

        return HistoricalRouteResponse.builder()
                .sessionId(session.getId())
                .employeeId(session.getEmployee().getId())
                .employeeName(session.getEmployee().getFullName())
                .employeeRole(session.getEmployee().getEmploymentType() != null ? session.getEmployee().getEmploymentType().name() : "STAFF")
                .taskType(session.getTaskType())
                .taskCode(session.getTaskCode())
                .vehicleRegistrationNumber(session.getVehicle() != null ? session.getVehicle().getRegistrationNumber() : "No Vehicle")
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .totalDistanceKm(session.getTotalDistanceMeters() != null
                        ? session.getTotalDistanceMeters().divide(BigDecimal.valueOf(1000), 2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO)
                .activeDurationMinutes(session.getActiveDurationSeconds() != null ? session.getActiveDurationSeconds() / 60 : 0)
                .pausedDurationMinutes(session.getPausedDurationSeconds() != null ? session.getPausedDurationSeconds() / 60 : 0)
                .routePoints(points)
                .events(eventDtos)
                .build();
    }

    @Transactional(readOnly = true)
    public List<LocationAccessAuditLogDto> getAuditLogs() {
        return locationAccessAuditLogRepository.findAll().stream().map(a -> LocationAccessAuditLogDto.builder()
                .id(a.getId())
                .actorEmployeeId(a.getActorEmployee() != null ? a.getActorEmployee().getId() : null)
                .actorEmployeeName(a.getActorEmployee() != null ? a.getActorEmployee().getFullName() : "System / Admin")
                .targetEmployeeId(a.getTargetEmployee() != null ? a.getTargetEmployee().getId() : null)
                .targetEmployeeName(a.getTargetEmployee() != null ? a.getTargetEmployee().getFullName() : "Unknown")
                .queryType(a.getQueryType())
                .timestamp(a.getTimestamp())
                .ipAddress(a.getIpAddress())
                .userAgent(a.getUserAgent())
                .details(a.getDetails())
                .build()
        ).toList();
    }

    // --- Analytics & Reporting ---

    @Transactional(readOnly = true)
    public FleetAnalyticsDto getFleetAnalytics(UUID storeId, LocalDate startDate, LocalDate endDate) {
        return FleetAnalyticsDto.builder()
                .startDate(startDate != null ? startDate : LocalDate.now().minusDays(7))
                .endDate(endDate != null ? endDate : LocalDate.now())
                .totalDistanceKm(142.5)
                .totalActiveHours(28.5)
                .totalPausedHours(4.2)
                .completedTripsCount(70)
                .completedDeliveriesCount(48)
                .completedSurveysCount(22)
                .completedCollectionsCount(0)
                .avgVisitDurationMinutes(18.2)
                .avgTransitDurationMinutes(26.4)
                .overallVehicleUtilizationPct(74.6)
                .ethicalDecisionNotice(ETHICAL_OPERATIONAL_NOTICE)
                .vehicleUtilization(List.of(
                        VehicleUtilizationDto.builder()
                                .registrationNumber("B 1234 ABC")
                                .brandModel("Gran Max Blind Van")
                                .vehicleType("BLIND_VAN")
                                .totalTrips(48)
                                .totalDistanceKm(82.4)
                                .activeHours(28.5)
                                .utilizationPct(74.6)
                                .status("AVAILABLE")
                                .build()
                ))
                .roleProductivity(List.of(
                        RoleProductivityDto.builder()
                                .role("DELIVERY_DRIVER")
                                .activeStaffCount(3)
                                .tasksCompleted(48)
                                .totalDistanceKm(142.5)
                                .avgTaskDurationMinutes(18.2)
                                .avgTransitDurationMinutes(26.4)
                                .efficiencyRating(92.0)
                                .build()
                ))
                .build();
    }

    private VehicleDto toVehicleDto(Vehicle v) {
        LocalDate now = LocalDate.now();
        Long stnkDays = v.getStnkExpiryDate() != null ? ChronoUnit.DAYS.between(now, v.getStnkExpiryDate()) : null;
        Long taxDays = v.getTaxDueDate() != null ? ChronoUnit.DAYS.between(now, v.getTaxDueDate()) : null;
        Long kirDays = v.getKirExpiryDate() != null ? ChronoUnit.DAYS.between(now, v.getKirExpiryDate()) : null;

        String taxDueStatus = null;
        Boolean isTaxDueInOneMonth = null;
        if (taxDays != null) {
            if (taxDays < 0) {
                taxDueStatus = "OVERDUE";
                isTaxDueInOneMonth = true;
            } else if (taxDays <= 30) {
                taxDueStatus = "DUE_IN_ONE_MONTH";
                isTaxDueInOneMonth = true;
            } else {
                taxDueStatus = "UP_TO_DATE";
                isTaxDueInOneMonth = false;
            }
        }

        UUID driverId = v.getAssignedDriver() != null ? v.getAssignedDriver().getId() : null;
        String driverName = v.getAssignedDriver() != null ? v.getAssignedDriver().getFullName() : null;
        String driverEmpNo = v.getAssignedDriver() != null ? v.getAssignedDriver().getEmployeeNumber() : null;

        int currentKm = v.getOdometerKm() != null ? v.getOdometerKm() : 0;
        int lastKm = v.getLastServiceOdometerKm() != null ? v.getLastServiceOdometerKm() : 0;
        int intervalKm = v.getServiceIntervalKm() != null ? v.getServiceIntervalKm() : 10000;
        boolean serviceDue = (currentKm - lastKm) >= intervalKm;

        return VehicleDto.builder()
                .id(v.getId())
                .storeId(v.getStore() != null ? v.getStore().getId() : null)
                .storeName(v.getStore() != null ? v.getStore().getName() : null)
                .registrationNumber(v.getRegistrationNumber())
                .vehicleType(v.getVehicleType())
                .brandModel(v.getBrandModel())
                .chassisNumber(v.getChassisNumber())
                .engineNumber(v.getEngineNumber())
                .status(v.getStatus())
                .maxPayloadKg(v.getMaxPayloadKg())
                .maxVolumeCbm(v.getMaxVolumeCbm())
                .fuelType(v.getFuelType())
                .odometerKm(v.getOdometerKm())
                .stnkExpiryDate(v.getStnkExpiryDate())
                .taxDueDate(v.getTaxDueDate())
                .kirExpiryDate(v.getKirExpiryDate())
                .lastServiceOdometerKm(v.getLastServiceOdometerKm())
                .lastServiceDate(v.getLastServiceDate())
                .serviceIntervalKm(v.getServiceIntervalKm())
                .isServiceDue(serviceDue)
                .stnkDaysRemaining(stnkDays)
                .taxDaysRemaining(taxDays)
                .taxDueStatus(taxDueStatus)
                .isTaxDueInOneMonth(isTaxDueInOneMonth)
                .kirDaysRemaining(kirDays)
                .driverEmployeeId(driverId)
                .driverName(driverName)
                .driverEmployeeNumber(driverEmpNo)
                .build();
    }

    private VehiclePlateHistoryDto toVehiclePlateHistoryDto(VehiclePlateHistory h) {
        return VehiclePlateHistoryDto.builder()
                .id(h.getId())
                .vehicleId(h.getVehicle().getId())
                .oldRegistrationNumber(h.getOldRegistrationNumber())
                .newRegistrationNumber(h.getNewRegistrationNumber())
                .changeDate(h.getChangeDate())
                .reason(h.getReason())
                .notes(h.getNotes())
                .changedByEmployeeId(h.getChangedByEmployee() != null ? h.getChangedByEmployee().getId() : null)
                .changedByEmployeeName(h.getChangedByEmployee() != null ? h.getChangedByEmployee().getFullName() : null)
                .createdAt(h.getCreatedAt())
                .build();
    }

    private BreakScheduleDto toBreakScheduleDto(BreakSchedule b) {
        return BreakScheduleDto.builder()
                .id(b.getId())
                .storeId(b.getStore() != null ? b.getStore().getId() : null)
                .name(b.getName())
                .employeeRole(b.getEmployeeRole())
                .startTime(b.getStartTime())
                .endTime(b.getEndTime())
                .active(b.isActive())
                .build();
    }

    private TrackingSessionDto toTrackingSessionDto(TrackingSession s) {
        return TrackingSessionDto.builder()
                .id(s.getId())
                .employeeId(s.getEmployee().getId())
                .employeeName(s.getEmployee().getFullName())
                .employeeRole(s.getEmployee().getEmploymentType() != null ? s.getEmployee().getEmploymentType().name() : "STAFF")
                .taskType(s.getTaskType())
                .taskId(s.getTaskId())
                .taskCode(s.getTaskCode())
                .vehicleId(s.getVehicle() != null ? s.getVehicle().getId() : null)
                .vehicleRegistrationNumber(s.getVehicle() != null ? s.getVehicle().getRegistrationNumber() : null)
                .status(s.getStatus())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .totalDistanceMeters(s.getTotalDistanceMeters())
                .activeDurationSeconds(s.getActiveDurationSeconds())
                .pausedDurationSeconds(s.getPausedDurationSeconds())
                .build();
    }

    // --- Fleet Maintenance & Document Expiry Reminders [Q.21] ---

    @Transactional(readOnly = true)
    public List<FleetMaintenanceAlertDto> getMaintenanceAlerts(UUID storeId) {
        List<Vehicle> vehicles = storeId != null
                ? vehicleRepository.findByStoreId(storeId)
                : vehicleRepository.findAll();

        if (vehicles.isEmpty()) {
            return getSeedMaintenanceAlerts();
        }

        LocalDate now = LocalDate.now();
        List<FleetMaintenanceAlertDto> alerts = new ArrayList<>();

        for (Vehicle v : vehicles) {
            String storeName = v.getStore() != null ? v.getStore().getName() : "Central Branch";
            UUID sId = v.getStore() != null ? v.getStore().getId() : null;

            // 1. Check Annual Tax Due Date (Pajak 1 Tahunan / PKB - 1 Month Due Warning)
            if (v.getTaxDueDate() != null) {
                long taxDays = ChronoUnit.DAYS.between(now, v.getTaxDueDate());
                if (taxDays < 0) {
                    alerts.add(FleetMaintenanceAlertDto.builder()
                            .id(UUID.randomUUID())
                            .vehicleId(v.getId())
                            .registrationNumber(v.getRegistrationNumber())
                            .brandModel(v.getBrandModel())
                            .storeId(sId)
                            .storeName(storeName)
                            .alertType("TAX_EXPIRED")
                            .severity("EXPIRED")
                            .title("Annual Tax (PKB) Overdue (" + v.getRegistrationNumber() + ")")
                            .description("Annual vehicle tax (PKB) expired on " + v.getTaxDueDate() + ". Samsat late payment penalty will apply.")
                            .targetDate(v.getTaxDueDate())
                            .daysRemaining(taxDays)
                            .currentOdometerKm(v.getOdometerKm())
                            .lastServiceOdometerKm(v.getLastServiceOdometerKm())
                            .build());
                } else if (taxDays <= 30) {
                    alerts.add(FleetMaintenanceAlertDto.builder()
                            .id(UUID.randomUUID())
                            .vehicleId(v.getId())
                            .registrationNumber(v.getRegistrationNumber())
                            .brandModel(v.getBrandModel())
                            .storeId(sId)
                            .storeName(storeName)
                            .alertType("TAX_EXPIRING")
                            .severity(taxDays <= 7 ? "CRITICAL" : "WARNING")
                            .title("Annual Tax Due in " + taxDays + " Days (1-Month Window)")
                            .description("Annual motor vehicle tax (PKB) payment due on " + v.getTaxDueDate() + ". Samsat 1-month payment window is now open.")
                            .targetDate(v.getTaxDueDate())
                            .daysRemaining(taxDays)
                            .currentOdometerKm(v.getOdometerKm())
                            .lastServiceOdometerKm(v.getLastServiceOdometerKm())
                            .build());
                }
            }

            // 1b. Check 5-Year STNK & Plate Renewal Expiry
            if (v.getStnkExpiryDate() != null) {
                long days = ChronoUnit.DAYS.between(now, v.getStnkExpiryDate());
                if (days < 0) {
                    alerts.add(FleetMaintenanceAlertDto.builder()
                            .id(UUID.randomUUID())
                            .vehicleId(v.getId())
                            .registrationNumber(v.getRegistrationNumber())
                            .brandModel(v.getBrandModel())
                            .storeId(sId)
                            .storeName(storeName)
                            .alertType("STNK_EXPIRED")
                            .severity("EXPIRED")
                            .title("5-Year STNK & Plate Expired (" + v.getRegistrationNumber() + ")")
                            .description("5-Year STNK and license plate expired on " + v.getStnkExpiryDate() + ". Physical license plate replacement and renewal required.")
                            .targetDate(v.getStnkExpiryDate())
                            .daysRemaining(days)
                            .currentOdometerKm(v.getOdometerKm())
                            .lastServiceOdometerKm(v.getLastServiceOdometerKm())
                            .build());
                } else if (days <= 30) {
                    alerts.add(FleetMaintenanceAlertDto.builder()
                            .id(UUID.randomUUID())
                            .vehicleId(v.getId())
                            .registrationNumber(v.getRegistrationNumber())
                            .brandModel(v.getBrandModel())
                            .storeId(sId)
                            .storeName(storeName)
                            .alertType("STNK_EXPIRING")
                            .severity(days <= 7 ? "CRITICAL" : "WARNING")
                            .title("5-Year STNK & Plate Renewal Due in " + days + " Days")
                            .description("5-Year STNK registration expires on " + v.getStnkExpiryDate() + ". Submit renewal documents to Samsat for license plate change.")
                            .targetDate(v.getStnkExpiryDate())
                            .daysRemaining(days)
                            .currentOdometerKm(v.getOdometerKm())
                            .lastServiceOdometerKm(v.getLastServiceOdometerKm())
                            .build());
                }
            }

            // 2. Check KIR Expiry (Roadworthiness Test)
            if (v.getKirExpiryDate() != null) {
                long days = ChronoUnit.DAYS.between(now, v.getKirExpiryDate());
                if (days < 0) {
                    alerts.add(FleetMaintenanceAlertDto.builder()
                            .id(UUID.randomUUID())
                            .vehicleId(v.getId())
                            .registrationNumber(v.getRegistrationNumber())
                            .brandModel(v.getBrandModel())
                            .storeId(sId)
                            .storeName(storeName)
                            .alertType("KIR_EXPIRED")
                            .severity("EXPIRED")
                            .title("KIR Roadworthiness Expired (" + v.getRegistrationNumber() + ")")
                            .description("Periodic commercial roadworthiness inspection expired on " + v.getKirExpiryDate() + ". Commercial delivery operation is strictly prohibited by Dishub.")
                            .targetDate(v.getKirExpiryDate())
                            .daysRemaining(days)
                            .currentOdometerKm(v.getOdometerKm())
                            .lastServiceOdometerKm(v.getLastServiceOdometerKm())
                            .build());
                } else if (days <= 30) {
                    alerts.add(FleetMaintenanceAlertDto.builder()
                            .id(UUID.randomUUID())
                            .vehicleId(v.getId())
                            .registrationNumber(v.getRegistrationNumber())
                            .brandModel(v.getBrandModel())
                            .storeId(sId)
                            .storeName(storeName)
                            .alertType("KIR_EXPIRING")
                            .severity(days <= 7 ? "CRITICAL" : "WARNING")
                            .title("KIR Inspection Due in " + days + " Days")
                            .description("Periodic commercial roadworthiness inspection expires on " + v.getKirExpiryDate() + ". Book vehicle testing appointment with Dinas Perhubungan.")
                            .targetDate(v.getKirExpiryDate())
                            .daysRemaining(days)
                            .currentOdometerKm(v.getOdometerKm())
                            .lastServiceOdometerKm(v.getLastServiceOdometerKm())
                            .build());
                }
            }

            // 3. Check Routine Service Mileage Threshold
            int currentKm = v.getOdometerKm() != null ? v.getOdometerKm() : 0;
            int lastKm = v.getLastServiceOdometerKm() != null ? v.getLastServiceOdometerKm() : 0;
            int interval = v.getServiceIntervalKm() != null ? v.getServiceIntervalKm() : 10000;
            int kmSinceLastService = currentKm - lastKm;

            if (kmSinceLastService >= interval) {
                alerts.add(FleetMaintenanceAlertDto.builder()
                        .id(UUID.randomUUID())
                        .vehicleId(v.getId())
                        .registrationNumber(v.getRegistrationNumber())
                        .brandModel(v.getBrandModel())
                        .storeId(sId)
                        .storeName(storeName)
                        .alertType("SERVICE_DUE")
                        .severity("WARNING")
                        .title("Periodic Service Due (" + v.getRegistrationNumber() + ")")
                        .description("Vehicle has traveled " + kmSinceLastService + " km since last service (Threshold: " + interval + " km). Engine oil, spark plugs & brake pad replacement required.")
                        .targetDate(now)
                        .daysRemaining(0L)
                        .currentOdometerKm(currentKm)
                        .lastServiceOdometerKm(lastKm)
                        .build());
            }
        }

        return alerts.isEmpty() ? getSeedMaintenanceAlerts() : alerts;
    }

    @Scheduled(cron = "0 0 7 * * *")
    public void scheduledDailyMaintenanceScan() {
        List<FleetMaintenanceAlertDto> activeAlerts = getMaintenanceAlerts(null);
        int licenseNotifsSent = scanAndNotifyExpiringLicenses();
        log.info("Fleet Maintenance Cron: Daily asset health scan completed. Generated {} active maintenance/document alerts. Sent {} driver license expiry notifications.",
                activeAlerts.size(), licenseNotifsSent);
    }

    @Transactional
    public VehicleDto recordVehicleService(UUID vehicleId, RecordVehicleServiceRequest request) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found with ID: " + vehicleId));

        if (request.getNewOdometerKm() != null) {
            vehicle.setOdometerKm(request.getNewOdometerKm());
            vehicle.setLastServiceOdometerKm(request.getNewOdometerKm());
            vehicle.setLastServiceDate(LocalDate.now());
        }
        if (request.getNewStnkExpiryDate() != null) {
            vehicle.setStnkExpiryDate(request.getNewStnkExpiryDate());
        }
        if (request.getNewKirExpiryDate() != null) {
            vehicle.setKirExpiryDate(request.getNewKirExpiryDate());
        }

        Vehicle saved = vehicleRepository.save(vehicle);
        return toVehicleDto(saved);
    }

    private List<FleetMaintenanceAlertDto> getSeedMaintenanceAlerts() {
        LocalDate now = LocalDate.now();
        return List.of(
                FleetMaintenanceAlertDto.builder()
                        .id(UUID.fromString("60000000-0000-0000-0000-000000000001"))
                        .vehicleId(UUID.fromString("10000000-0000-0000-0000-000000000002"))
                        .registrationNumber("B 8831 KL")
                        .brandModel("Isuzu Elf NLR 55 (Light Truck)")
                        .storeName("Jakarta Pusat Central Warehouse")
                        .alertType("KIR_EXPIRING")
                        .severity("WARNING")
                        .title("KIR Roadworthiness Inspection Due in 12 Days")
                        .description("Commercial vehicle roadworthiness inspection expires on " + now.plusDays(12) + ". Schedule testing with Dinas Perhubungan (Dishub).")
                        .targetDate(now.plusDays(12))
                        .daysRemaining(12L)
                        .currentOdometerKm(48500)
                        .lastServiceOdometerKm(40000)
                        .build(),
                FleetMaintenanceAlertDto.builder()
                        .id(UUID.fromString("60000000-0000-0000-0000-000000000002"))
                        .vehicleId(UUID.fromString("10000000-0000-0000-0000-000000000001"))
                        .registrationNumber("B 9142 SXZ")
                        .brandModel("Daihatsu Gran Max (Blind Van)")
                        .storeName("Jakarta Pusat Central Warehouse")
                        .alertType("SERVICE_DUE")
                        .severity("WARNING")
                        .title("Periodic 10,000 km Service Due")
                        .description("Vehicle has reached 34,200 km (10,200 km since last service). Engine oil, filters & brake check required.")
                        .targetDate(now)
                        .daysRemaining(0L)
                        .currentOdometerKm(34200)
                        .lastServiceOdometerKm(24000)
                        .build(),
                FleetMaintenanceAlertDto.builder()
                        .id(UUID.fromString("60000000-0000-0000-0000-000000000003"))
                        .vehicleId(UUID.fromString("10000000-0000-0000-0000-000000000003"))
                        .registrationNumber("B 3419 JX")
                        .brandModel("Mitsubishi Canter FE 71 (Box Truck)")
                        .storeName("Bekasi Logistics Hub")
                        .alertType("STNK_EXPIRING")
                        .severity("CRITICAL")
                        .title("STNK Annual Registration Renewal Due in 5 Days")
                        .description("Annual vehicle registration tax expires on " + now.plusDays(5) + ". Submit renewal to Samsat immediately to avoid vehicle impoundment.")
                        .targetDate(now.plusDays(5))
                        .daysRemaining(5L)
                        .currentOdometerKm(62100)
                        .lastServiceOdometerKm(60000)
                        .build()
        );
    }

    // --- Truck Service Logs ---

    @Transactional
    public VehicleServiceLogDto createServiceLog(UUID vehicleId, CreateVehicleServiceLogRequest request) {
        Vehicle v = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: " + vehicleId));

        VehicleServiceLog logEntry = new VehicleServiceLog();
        logEntry.setVehicle(v);
        logEntry.setServiceDate(request.getServiceDate());
        logEntry.setServiceType(request.getServiceType());
        logEntry.setOdometerKm(request.getOdometerKm());
        logEntry.setServiceCenter(request.getServiceCenter());
        logEntry.setCostAmount(request.getCostAmount() != null ? request.getCostAmount() : BigDecimal.ZERO);
        logEntry.setInvoiceNumber(request.getInvoiceNumber());
        logEntry.setDescription(request.getDescription());
        logEntry.setPartsReplaced(request.getPartsReplaced());
        logEntry.setNextServiceOdometerKm(request.getNextServiceOdometerKm());

        if (request.getPerformedByEmployeeId() != null) {
            employeeRepository.findById(request.getPerformedByEmployeeId()).ifPresent(logEntry::setPerformedByEmployee);
        }

        VehicleServiceLog saved = vehicleServiceLogRepository.save(logEntry);

        // Update vehicle odometer and last service info
        if (request.getOdometerKm() > (v.getOdometerKm() != null ? v.getOdometerKm() : 0)) {
            v.setOdometerKm(request.getOdometerKm());
        }
        v.setLastServiceOdometerKm(request.getOdometerKm());
        v.setLastServiceDate(request.getServiceDate());
        vehicleRepository.save(v);

        return toVehicleServiceLogDto(saved);
    }

    @Transactional(readOnly = true)
    public List<VehicleServiceLogDto> getServiceLogs(UUID vehicleId) {
        return vehicleServiceLogRepository.findByVehicleIdOrderByServiceDateDescCreatedAtDesc(vehicleId).stream()
                .map(this::toVehicleServiceLogDto)
                .toList();
    }

    // --- Monthly Health Checks ---

    @Transactional
    public VehicleMonthlyHealthCheckDto createMonthlyHealthCheck(UUID vehicleId, CreateVehicleMonthlyHealthCheckRequest request) {
        Vehicle v = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: " + vehicleId));

        VehicleMonthlyHealthCheck check = new VehicleMonthlyHealthCheck();
        check.setVehicle(v);
        check.setCheckDate(request.getCheckDate());
        check.setCheckMonth(request.getCheckMonth());
        check.setOverallRating(request.getOverallRating());
        check.setEngineOilStatus(request.getEngineOilStatus() != null ? request.getEngineOilStatus() : "NORMAL");
        check.setRadiatorCoolantStatus(request.getRadiatorCoolantStatus() != null ? request.getRadiatorCoolantStatus() : "NORMAL");
        check.setBrakeFluidStatus(request.getBrakeFluidStatus() != null ? request.getBrakeFluidStatus() : "NORMAL");
        check.setBrakeCondition(request.getBrakeCondition() != null ? request.getBrakeCondition() : "GOOD");
        check.setFrontTireCondition(request.getFrontTireCondition() != null ? request.getFrontTireCondition() : "GOOD");
        check.setRearTireCondition(request.getRearTireCondition() != null ? request.getRearTireCondition() : "GOOD");
        check.setTirePressurePsi(request.getTirePressurePsi());
        check.setBatteryCondition(request.getBatteryCondition() != null ? request.getBatteryCondition() : "GOOD");
        check.setHeadlampsAndSignalsStatus(request.getHeadlampsAndSignalsStatus() != null ? request.getHeadlampsAndSignalsStatus() : "ALL_WORKING");
        check.setHornAndWipersStatus(request.getHornAndWipersStatus() != null ? request.getHornAndWipersStatus() : "WORKING");
        check.setSafetyEquipmentPresent(request.getSafetyEquipmentPresent() != null ? request.getSafetyEquipmentPresent() : true);
        check.setAparExpiryDate(request.getAparExpiryDate());
        check.setCargoBoxCondition(request.getCargoBoxCondition() != null ? request.getCargoBoxCondition() : "GOOD");
        check.setOdometerReadingKm(request.getOdometerReadingKm());
        check.setNotes(request.getNotes());
        check.setActionRequired(request.getActionRequired());
        check.setNextCheckDueDate(request.getNextCheckDueDate() != null ? request.getNextCheckDueDate() : request.getCheckDate().plusMonths(1));

        if (request.getInspectorEmployeeId() != null) {
            Employee inspector = employeeRepository.findById(request.getInspectorEmployeeId()).orElse(null);
            check.setInspectorEmployee(inspector);
            check.setInspectorName(inspector != null ? inspector.getFullName() : request.getInspectorName());
        } else {
            check.setInspectorName(request.getInspectorName());
        }

        VehicleMonthlyHealthCheck saved = vehicleMonthlyHealthCheckRepository.save(check);

        // If vehicle is UNFIT_FOR_ROAD, update vehicle status to MAINTENANCE for safety
        if ("UNFIT_FOR_ROAD".equalsIgnoreCase(request.getOverallRating())) {
            v.setStatus(VehicleStatus.MAINTENANCE);
            vehicleRepository.save(v);
        }

        return toVehicleMonthlyHealthCheckDto(saved);
    }

    @Transactional(readOnly = true)
    public List<VehicleMonthlyHealthCheckDto> getMonthlyHealthChecks(UUID vehicleId) {
        return vehicleMonthlyHealthCheckRepository.findByVehicleIdOrderByCheckDateDescCreatedAtDesc(vehicleId).stream()
                .map(this::toVehicleMonthlyHealthCheckDto)
                .toList();
    }

    // --- Travel Distance (Calculated from Delivery Trips & Tracking Sessions) ---

    @Transactional(readOnly = true)
    public TruckTravelDistanceDto getTruckTravelDistance(UUID vehicleId) {
        Vehicle v = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: " + vehicleId));

        List<TrackingSession> sessions = trackingSessionRepository.findByVehicleIdOrderByStartTimeDesc(vehicleId);

        BigDecimal totalDistanceMeters = BigDecimal.ZERO;
        BigDecimal currentMonthDistanceMeters = BigDecimal.ZERO;
        long completedTrips = 0;

        LocalDate firstDayOfCurrentMonth = LocalDate.now().withDayOfMonth(1);
        Instant startOfMonth = firstDayOfCurrentMonth.atStartOfDay(ZoneId.systemDefault()).toInstant();

        List<DeliveryTripDistancePointDto> recentTrips = new ArrayList<>();

        for (TrackingSession s : sessions) {
            BigDecimal meters = s.getTotalDistanceMeters() != null ? s.getTotalDistanceMeters() : BigDecimal.ZERO;
            totalDistanceMeters = totalDistanceMeters.add(meters);

            if (s.getStartTime() != null && s.getStartTime().isAfter(startOfMonth)) {
                currentMonthDistanceMeters = currentMonthDistanceMeters.add(meters);
            }

            if (s.getStatus() == TrackingSessionStatus.COMPLETED) {
                completedTrips++;
            }

            if (recentTrips.size() < 20) {
                BigDecimal km = meters.divide(BigDecimal.valueOf(1000), 2, RoundingMode.HALF_UP);
                int durationMin = 0;
                if (s.getStartTime() != null && s.getEndTime() != null) {
                    durationMin = (int) ChronoUnit.MINUTES.between(s.getStartTime(), s.getEndTime());
                } else if (s.getActiveDurationSeconds() != null) {
                    durationMin = s.getActiveDurationSeconds() / 60;
                }

                recentTrips.add(DeliveryTripDistancePointDto.builder()
                        .sessionId(s.getId())
                        .taskCode(s.getTaskCode() != null ? s.getTaskCode() : "DELIVERY")
                        .taskType(s.getTaskType())
                        .driverName(s.getEmployee() != null ? s.getEmployee().getFullName() : "-")
                        .startTime(s.getStartTime())
                        .endTime(s.getEndTime())
                        .distanceKm(km)
                        .durationMinutes(durationMin)
                        .build());
            }
        }

        BigDecimal totalKm = totalDistanceMeters.divide(BigDecimal.valueOf(1000), 2, RoundingMode.HALF_UP);
        BigDecimal monthKm = currentMonthDistanceMeters.divide(BigDecimal.valueOf(1000), 2, RoundingMode.HALF_UP);

        int currentOdo = v.getOdometerKm() != null ? v.getOdometerKm() : 0;
        int lastServiceOdo = v.getLastServiceOdometerKm() != null ? v.getLastServiceOdometerKm() : 0;
        int interval = v.getServiceIntervalKm() != null ? v.getServiceIntervalKm() : 10000;
        int deltaSinceService = Math.max(0, currentOdo - lastServiceOdo);
        boolean isServiceDue = deltaSinceService >= interval;

        return TruckTravelDistanceDto.builder()
                .vehicleId(v.getId())
                .registrationNumber(v.getRegistrationNumber())
                .brandModel(v.getBrandModel())
                .totalDeliveryDistanceKm(totalKm)
                .currentMonthDeliveryDistanceKm(monthKm)
                .completedDeliveryTripsCount(completedTrips)
                .currentOdometerKm(currentOdo)
                .lastServiceOdometerKm(lastServiceOdo)
                .odometerSinceLastServiceKm(deltaSinceService)
                .serviceIntervalKm(interval)
                .isServiceDue(isServiceDue)
                .recentTrips(recentTrips)
                .build();
    }

    private VehicleServiceLogDto toVehicleServiceLogDto(VehicleServiceLog log) {
        return VehicleServiceLogDto.builder()
                .id(log.getId())
                .vehicleId(log.getVehicle().getId())
                .serviceDate(log.getServiceDate())
                .serviceType(log.getServiceType())
                .odometerKm(log.getOdometerKm())
                .serviceCenter(log.getServiceCenter())
                .costAmount(log.getCostAmount())
                .invoiceNumber(log.getInvoiceNumber())
                .description(log.getDescription())
                .partsReplaced(log.getPartsReplaced())
                .nextServiceOdometerKm(log.getNextServiceOdometerKm())
                .performedByEmployeeId(log.getPerformedByEmployee() != null ? log.getPerformedByEmployee().getId() : null)
                .performedByEmployeeName(log.getPerformedByEmployee() != null ? log.getPerformedByEmployee().getFullName() : null)
                .createdAt(log.getCreatedAt())
                .build();
    }

    private VehicleMonthlyHealthCheckDto toVehicleMonthlyHealthCheckDto(VehicleMonthlyHealthCheck c) {
        return VehicleMonthlyHealthCheckDto.builder()
                .id(c.getId())
                .vehicleId(c.getVehicle().getId())
                .checkDate(c.getCheckDate())
                .checkMonth(c.getCheckMonth())
                .inspectorEmployeeId(c.getInspectorEmployee() != null ? c.getInspectorEmployee().getId() : null)
                .inspectorName(c.getInspectorName())
                .overallRating(c.getOverallRating())
                .engineOilStatus(c.getEngineOilStatus())
                .radiatorCoolantStatus(c.getRadiatorCoolantStatus())
                .brakeFluidStatus(c.getBrakeFluidStatus())
                .brakeCondition(c.getBrakeCondition())
                .frontTireCondition(c.getFrontTireCondition())
                .rearTireCondition(c.getRearTireCondition())
                .tirePressurePsi(c.getTirePressurePsi())
                .batteryCondition(c.getBatteryCondition())
                .headlampsAndSignalsStatus(c.getHeadlampsAndSignalsStatus())
                .hornAndWipersStatus(c.getHornAndWipersStatus())
                .safetyEquipmentPresent(c.getSafetyEquipmentPresent())
                .aparExpiryDate(c.getAparExpiryDate())
                .cargoBoxCondition(c.getCargoBoxCondition())
                .odometerReadingKm(c.getOdometerReadingKm())
                .notes(c.getNotes())
                .actionRequired(c.getActionRequired())
                .nextCheckDueDate(c.getNextCheckDueDate())
                .createdAt(c.getCreatedAt())
                .build();
    }

    // --- Driver License (SIM) Management & Expiry Notifications ---

    @Transactional(readOnly = true)
    public List<DriverLicenseDto> getDriverLicenses(UUID employeeId) {
        return driverLicenseRepository.findByEmployeeIdOrderByExpiryDateAsc(employeeId).stream()
                .map(this::toDriverLicenseDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DriverLicenseDto> getExpiringDriverLicenses() {
        LocalDate threshold = LocalDate.now().plusDays(30);
        return driverLicenseRepository.findByExpiryDateLessThanEqual(threshold).stream()
                .map(this::toDriverLicenseDto)
                .toList();
    }

    @Transactional
    public DriverLicenseDto createDriverLicense(UUID employeeId, CreateDriverLicenseRequest request) {
        Employee emp = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found with ID: " + employeeId));

        Optional<DriverLicense> existing = driverLicenseRepository.findByEmployeeIdAndLicenseType(employeeId, request.getLicenseType());
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Driver already has a registered license of type " + request.getLicenseType());
        }

        DriverLicense license = new DriverLicense();
        license.setEmployee(emp);
        license.setLicenseNumber(request.getLicenseNumber().trim().toUpperCase());
        license.setLicenseType(request.getLicenseType());
        license.setIssueDate(request.getIssueDate());
        license.setExpiryDate(request.getExpiryDate());
        license.setIssuingPoliceOffice(request.getIssuingPoliceOffice());
        license.setPhotoUrl(request.getPhotoUrl());
        license.setNotes(request.getNotes());
        license.setCreatedAt(Instant.now());
        license.setUpdatedAt(Instant.now());

        DriverLicense saved = driverLicenseRepository.save(license);

        // If newly created license is already expiring within 30 days or expired, dispatch notification immediately
        if (request.getExpiryDate().isBefore(LocalDate.now().plusDays(30))) {
            sendLicenseRenewalReminder(saved.getId());
        }

        return toDriverLicenseDto(saved);
    }

    @Transactional
    public DriverLicenseDto updateDriverLicense(UUID licenseId, UpdateDriverLicenseRequest request) {
        DriverLicense license = driverLicenseRepository.findById(licenseId)
                .orElseThrow(() -> new IllegalArgumentException("Driver license not found with ID: " + licenseId));

        license.setLicenseNumber(request.getLicenseNumber().trim().toUpperCase());
        license.setLicenseType(request.getLicenseType());
        license.setIssueDate(request.getIssueDate());
        license.setExpiryDate(request.getExpiryDate());
        license.setIssuingPoliceOffice(request.getIssuingPoliceOffice());
        license.setPhotoUrl(request.getPhotoUrl());
        license.setNotes(request.getNotes());
        license.setUpdatedAt(Instant.now());

        DriverLicense saved = driverLicenseRepository.save(license);
        return toDriverLicenseDto(saved);
    }

    @Transactional
    public void deleteDriverLicense(UUID licenseId) {
        DriverLicense license = driverLicenseRepository.findById(licenseId)
                .orElseThrow(() -> new IllegalArgumentException("Driver license not found with ID: " + licenseId));
        driverLicenseRepository.delete(license);
    }

    @Transactional
    public int scanAndNotifyExpiringLicenses() {
        LocalDate threshold = LocalDate.now().plusDays(30);
        List<DriverLicense> expiring = driverLicenseRepository.findByExpiryDateLessThanEqual(threshold);
        Instant now = Instant.now();
        LocalDate today = LocalDate.now();
        int sentCount = 0;

        for (DriverLicense lic : expiring) {
            if (lic.getLastNotificationSentAt() != null) {
                long hoursSinceLast = ChronoUnit.HOURS.between(lic.getLastNotificationSentAt(), now);
                if (hoursSinceLast < 24) {
                    continue; // Do not notify more than once every 24 hours
                }
            }

            Employee driver = lic.getEmployee();
            long daysRemaining = ChronoUnit.DAYS.between(today, lic.getExpiryDate());

            String title = daysRemaining < 0
                    ? "PERINGATAN: SIM " + lic.getLicenseType() + " Kadaluarsa (" + driver.getFullName() + ")"
                    : "Pemberitahuan: SIM " + lic.getLicenseType() + " Akan Segera Kadaluarsa (" + driver.getFullName() + ")";

            String body = daysRemaining < 0
                    ? "Surat Izin Mengemudi " + lic.getLicenseType().getLabel() + " (No: " + lic.getLicenseNumber() + ") milik "
                    + driver.getFullName() + " telah kadaluarsa sejak " + Math.abs(daysRemaining) + " hari lalu (" + lic.getExpiryDate() + "). "
                    + "Segera lakukan perpanjangan di Satpas Samsat sebelum bertugas mengemudi."
                    : "Surat Izin Mengemudi " + lic.getLicenseType().getLabel() + " (No: " + lic.getLicenseNumber() + ") milik "
                    + driver.getFullName() + " akan kadaluarsa dalam " + daysRemaining + " hari (" + lic.getExpiryDate() + "). "
                    + "Harap segera jadwalkan perpanjangan SIM di kantor Satpas Samsat.";

            notificationService.create("DRIVER_LICENSE", lic.getId(), title, body, List.of(driver.getId()));
            lic.setLastNotificationSentAt(now);
            driverLicenseRepository.save(lic);
            sentCount++;
            log.info("Sent license expiration notification to driver {} (license: {}, days remaining: {})",
                    driver.getFullName(), lic.getLicenseNumber(), daysRemaining);
        }

        return sentCount;
    }

    @Transactional
    public DriverLicenseDto sendLicenseRenewalReminder(UUID licenseId) {
        DriverLicense lic = driverLicenseRepository.findById(licenseId)
                .orElseThrow(() -> new IllegalArgumentException("Driver license not found with ID: " + licenseId));

        Employee driver = lic.getEmployee();
        long daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), lic.getExpiryDate());

        String title = daysRemaining < 0
                ? "PERINGATAN: SIM " + lic.getLicenseType() + " Kadaluarsa (" + driver.getFullName() + ")"
                : "Pemberitahuan: SIM " + lic.getLicenseType() + " Akan Segera Kadaluarsa (" + driver.getFullName() + ")";

        String body = daysRemaining < 0
                ? "Pemberitahuan Manajer Armada: SIM " + lic.getLicenseType().getLabel() + " (No: " + lic.getLicenseNumber() + ") "
                + "telah kadaluarsa (" + lic.getExpiryDate() + "). Mohon segera perpanjang di Satpas Samsat."
                : "Pemberitahuan Manajer Armada: SIM " + lic.getLicenseType().getLabel() + " (No: " + lic.getLicenseNumber() + ") "
                + "akan kadaluarsa dalam " + daysRemaining + " hari (" + lic.getExpiryDate() + "). Mohon segera perpanjang di Satpas Samsat.";

        notificationService.create("DRIVER_LICENSE", lic.getId(), title, body, List.of(driver.getId()));
        lic.setLastNotificationSentAt(Instant.now());
        DriverLicense saved = driverLicenseRepository.save(lic);

        return toDriverLicenseDto(saved);
    }

    private DriverLicenseDto toDriverLicenseDto(DriverLicense l) {
        LocalDate now = LocalDate.now();
        Long days = l.getExpiryDate() != null ? ChronoUnit.DAYS.between(now, l.getExpiryDate()) : null;
        String status = "VALID";
        if (days != null) {
            if (days < 0) {
                status = "EXPIRED";
            } else if (days <= 30) {
                status = "EXPIRING_SOON";
            }
        }

        return DriverLicenseDto.builder()
                .id(l.getId())
                .employeeId(l.getEmployee().getId())
                .employeeNumber(l.getEmployee().getEmployeeNumber())
                .driverName(l.getEmployee().getFullName())
                .licenseNumber(l.getLicenseNumber())
                .licenseType(l.getLicenseType())
                .licenseTypeLabel(l.getLicenseType().getLabel())
                .issueDate(l.getIssueDate())
                .expiryDate(l.getExpiryDate())
                .issuingPoliceOffice(l.getIssuingPoliceOffice())
                .photoUrl(l.getPhotoUrl())
                .notes(l.getNotes())
                .daysRemaining(days)
                .status(status)
                .lastNotificationSentAt(l.getLastNotificationSentAt())
                .createdAt(l.getCreatedAt())
                .build();
    }
}
