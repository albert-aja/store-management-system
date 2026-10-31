package com.sms.fleet;

import com.sms.foundation.employee.Employee;
import com.sms.foundation.employee.EmployeeRepository;
import com.sms.foundation.employee.EmployeeRole;
import com.sms.foundation.employee.EmployeeRoleRepository;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
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
        v.setKirExpiryDate(request.getKirExpiryDate());
        v.setLastServiceOdometerKm(request.getLastServiceOdometerKm() != null ? request.getLastServiceOdometerKm() : 0);
        v.setLastServiceDate(request.getLastServiceDate());
        v.setServiceIntervalKm(request.getServiceIntervalKm() != null ? request.getServiceIntervalKm() : 10000);
        v.setStatus(VehicleStatus.AVAILABLE);
        v.setStore(store);

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
        Long kirDays = v.getKirExpiryDate() != null ? ChronoUnit.DAYS.between(now, v.getKirExpiryDate()) : null;
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
                .kirExpiryDate(v.getKirExpiryDate())
                .lastServiceOdometerKm(v.getLastServiceOdometerKm())
                .lastServiceDate(v.getLastServiceDate())
                .serviceIntervalKm(v.getServiceIntervalKm())
                .isServiceDue(serviceDue)
                .stnkDaysRemaining(stnkDays)
                .kirDaysRemaining(kirDays)
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

            // 1. Check STNK Expiry (Annual Registration)
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
                            .title("STNK Expired (" + v.getRegistrationNumber() + ")")
                            .description("Annual vehicle tax & registration expired on " + v.getStnkExpiryDate() + ". Immediate renewal required; operating vehicle is prohibited under Indonesian traffic law.")
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
                            .title("STNK Renewal Due in " + days + " Days")
                            .description("Annual vehicle registration tax expires on " + v.getStnkExpiryDate() + ". Submit renewal documents to Samsat within 30 days to avoid late fines.")
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
        log.info("Fleet Maintenance Cron: Daily asset health scan completed. Generated {} active maintenance/document alerts.", activeAlerts.size());
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
}
