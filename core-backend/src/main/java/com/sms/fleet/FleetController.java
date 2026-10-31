package com.sms.fleet;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/fleet")
@RequiredArgsConstructor
public class FleetController {

    private final FleetService fleetService;

    // --- Live Monitoring ---

    @GetMapping("/live")
    public List<LiveFleetStatusDto> getLiveFleet(@RequestParam(required = false) UUID storeId) {
        return fleetService.getLiveFleetStatus(storeId);
    }

    // --- Historical Route Playback ---

    @GetMapping("/history")
    public HistoricalRouteResponse getHistoricalRoute(
            @RequestParam(required = false) UUID sessionId,
            @RequestParam(required = false) UUID actorId,
            HttpServletRequest request
    ) {
        String ip = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");
        return fleetService.getHistoricalRoute(sessionId, actorId, ip, userAgent);
    }

    // --- Vehicle Management ---

    @GetMapping("/vehicles")
    public List<VehicleDto> listVehicles(
            @RequestParam(required = false) UUID storeId,
            @RequestParam(required = false) VehicleStatus status
    ) {
        return fleetService.getVehicles(storeId, status);
    }

    @PostMapping("/vehicles")
    @ResponseStatus(HttpStatus.CREATED)
    public VehicleDto createVehicle(@Valid @RequestBody CreateVehicleRequest request) {
        return fleetService.createVehicle(request);
    }

    @PatchMapping("/vehicles/{id}/status")
    public VehicleDto updateVehicleStatus(
            @PathVariable UUID id,
            @RequestParam VehicleStatus status
    ) {
        return fleetService.updateVehicleStatus(id, status);
    }

    // --- Break Schedules ---

    @GetMapping("/break-schedules")
    public List<BreakScheduleDto> listBreakSchedules(@RequestParam(required = false) UUID storeId) {
        return fleetService.getBreakSchedules(storeId);
    }

    @PostMapping("/break-schedules")
    @ResponseStatus(HttpStatus.CREATED)
    public BreakScheduleDto createBreakSchedule(@Valid @RequestBody CreateBreakScheduleRequest request) {
        return fleetService.createBreakSchedule(request);
    }

    // --- Session Lifecycle & Telematics ---

    @PostMapping("/sessions/start")
    @ResponseStatus(HttpStatus.CREATED)
    public TrackingSessionDto startSession(@Valid @RequestBody StartTrackingSessionRequest request) {
        return fleetService.startTrackingSession(request);
    }

    @PostMapping("/sessions/{id}/complete")
    public TrackingSessionDto completeSession(@PathVariable UUID id) {
        return fleetService.completeTrackingSession(id);
    }

    @PostMapping("/sessions/{id}/events")
    @ResponseStatus(HttpStatus.CREATED)
    public void recordEvent(@PathVariable UUID id, @Valid @RequestBody RecordSessionEventRequest request) {
        fleetService.recordSessionEvent(id, request);
    }

    @PostMapping("/sessions/{id}/locations")
    public int ingestLocations(@PathVariable UUID id, @Valid @RequestBody LocationIngestionRequest request) {
        return fleetService.ingestLocations(id, request);
    }

    // --- Audit Logs ---

    @GetMapping("/audit-logs")
    public List<LocationAccessAuditLogDto> getAuditLogs() {
        return fleetService.getAuditLogs();
    }

    // --- Operational Analytics & Productivity ---

    @GetMapping("/analytics")
    public FleetAnalyticsDto getFleetAnalytics(
            @RequestParam(required = false) UUID storeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return fleetService.getFleetAnalytics(storeId, startDate, endDate);
    }

    // --- Fleet Maintenance & Expiry Reminders [Q.21] ---

    @GetMapping("/maintenance-alerts")
    public List<FleetMaintenanceAlertDto> getMaintenanceAlerts(@RequestParam(required = false) UUID storeId) {
        return fleetService.getMaintenanceAlerts(storeId);
    }

    @PostMapping("/vehicles/{id}/service-log")
    public VehicleDto recordVehicleService(
            @PathVariable UUID id,
            @Valid @RequestBody RecordVehicleServiceRequest request
    ) {
        return fleetService.recordVehicleService(id, request);
    }
}
