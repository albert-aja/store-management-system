import axios from "axios";

export type VehicleType =
  | "MOTORCYCLE"
  | "BLIND_VAN"
  | "PICKUP_TRUCK"
  | "LIGHT_TRUCK_4W"
  | "MEDIUM_TRUCK_6W";

export type VehicleStatus = "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "DECOMMISSIONED";

export type TrackingTaskType = "DELIVERY_TRIP" | "SURVEY_TASK" | "COLLECTION_TASK";

export type TrackingSessionStatus =
  | "NOT_STARTED"
  | "ACTIVE"
  | "PAUSED"
  | "INTERRUPTED"
  | "COMPLETED";

export type TrackingEventType =
  | "SESSION_STARTED"
  | "SCHEDULED_BREAK_PAUSE"
  | "SCHEDULED_BREAK_RESUME"
  | "MANUAL_PAUSE"
  | "MANUAL_RESUME"
  | "GPS_LOST"
  | "GPS_RESTORED"
  | "NETWORK_OFFLINE"
  | "NETWORK_RESTORED"
  | "OS_TERMINATION_DETECTED"
  | "BATTERY_THERMAL_CUTOFF"
  | "BATTERY_THERMAL_RECOVERED"
  | "GEOFENCE_PROXIMITY_ENTERED"
  | "SESSION_COMPLETED";

export type LocationAccessQueryType =
  | "LIVE_MONITOR_VIEW"
  | "HISTORICAL_ROUTE_PLAYBACK"
  | "REPORT_EXPORT"
  | "RAW_COORDINATE_INSPECT";

export interface VehicleDto {
  id: string;
  storeId?: string;
  storeName?: string;
  registrationNumber: string;
  vehicleType: VehicleType;
  brandModel: string;
  chassisNumber?: string;
  engineNumber?: string;
  status: VehicleStatus;
  maxPayloadKg?: number;
  maxVolumeCbm?: number;
  fuelType?: string;
  odometerKm?: number;
  stnkExpiryDate?: string;
  kirExpiryDate?: string;
  lastServiceOdometerKm?: number;
  lastServiceDate?: string;
  serviceIntervalKm?: number;
  isServiceDue?: boolean;
  stnkDaysRemaining?: number;
  kirDaysRemaining?: number;
}

export interface CreateVehicleRequest {
  storeId?: string;
  registrationNumber: string;
  vehicleType: VehicleType;
  brandModel: string;
  chassisNumber?: string;
  engineNumber?: string;
  maxPayloadKg?: number;
  maxVolumeCbm?: number;
  fuelType?: string;
  odometerKm?: number;
  stnkExpiryDate?: string;
  kirExpiryDate?: string;
  lastServiceOdometerKm?: number;
  lastServiceDate?: string;
  serviceIntervalKm?: number;
}

export interface FleetMaintenanceAlertDto {
  vehicleId: string;
  registrationNumber: string;
  brandModel: string;
  vehicleType: VehicleType;
  alertType: "STNK_EXPIRING" | "KIR_EXPIRING" | "SERVICE_DUE";
  severity: "CRITICAL" | "WARNING" | "EXPIRED";
  message: string;
  daysRemaining?: number;
  dueOdometerKm?: number;
  currentOdometerKm?: number;
}

export interface RecordVehicleServiceRequest {
  serviceDate: string;
  odometerKm: number;
  serviceIntervalKm?: number;
  notes?: string;
}

export interface BreakScheduleDto {
  id: string;
  storeId?: string;
  name: string;
  employeeRole?: string;
  startTime: string;
  endTime: string;
  active: boolean;
}

export interface CreateBreakScheduleRequest {
  storeId?: string;
  name: string;
  employeeRole?: string;
  startTime: string;
  endTime: string;
}

export interface LiveFleetStatusDto {
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  sessionId: string;
  trackingStatus: TrackingSessionStatus;
  taskType: TrackingTaskType;
  taskCode: string;
  vehicleId?: string;
  vehicleRegistrationNumber?: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  speedKmh?: number;
  headingDegrees?: number;
  batteryLevelPct?: number;
  lastPingAt: string;
}

export interface LocationPointDto {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  speedMps?: number;
  headingDegrees?: number;
  altitudeMeters?: number;
  batteryLevelPct?: number;
  isMockProvider?: boolean;
  recordedAt: string;
}

export interface SessionEventDto {
  id: string;
  eventType: TrackingEventType;
  eventTimestamp: string;
  reasonCode?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

export interface HistoricalRouteResponse {
  sessionId: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  taskType: TrackingTaskType;
  taskCode: string;
  vehicleRegistrationNumber?: string;
  startTime: string;
  endTime?: string;
  totalDistanceKm: number;
  activeDurationMinutes: number;
  pausedDurationMinutes: number;
  routePoints: LocationPointDto[];
  events: SessionEventDto[];
}

export interface LocationAccessAuditLogDto {
  id: string;
  actorEmployeeId: string;
  actorEmployeeName: string;
  targetEmployeeId?: string;
  targetEmployeeName?: string;
  queryType: LocationAccessQueryType;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
}

export interface VehicleUtilizationDto {
  registrationNumber: string;
  brandModel: string;
  vehicleType: string;
  totalTrips: number;
  totalDistanceKm: number;
  activeHours: number;
  utilizationPct: number;
  status: string;
}

export interface RoleProductivityDto {
  role: string;
  activeStaffCount: number;
  tasksCompleted: number;
  totalDistanceKm: number;
  avgTaskDurationMinutes: number;
  avgTransitDurationMinutes: number;
  efficiencyRating: number;
}

export interface FleetAnalyticsDto {
  startDate: string;
  endDate: string;
  totalDistanceKm: number;
  totalActiveHours: number;
  totalPausedHours: number;
  completedTripsCount: number;
  completedDeliveriesCount: number;
  completedSurveysCount: number;
  completedCollectionsCount: number;
  avgVisitDurationMinutes: number;
  avgTransitDurationMinutes: number;
  overallVehicleUtilizationPct: number;
  vehicleUtilization: VehicleUtilizationDto[];
  roleProductivity: RoleProductivityDto[];
  interruptionCounts: Record<string, number>;
  ethicalDecisionNotice: string;
}

const API_BASE = "/api/v1/fleet";

export const fleetApi = {
  getLiveFleet: async (storeId?: string): Promise<LiveFleetStatusDto[]> => {
    const params = storeId ? { storeId } : {};
    const res = await axios.get<LiveFleetStatusDto[]>(`${API_BASE}/live`, { params });
    return res.data;
  },

  getHistoricalRoute: async (sessionId?: string, actorId?: string): Promise<HistoricalRouteResponse> => {
    const params: Record<string, string> = {};
    if (sessionId) params.sessionId = sessionId;
    if (actorId) params.actorId = actorId;
    const res = await axios.get<HistoricalRouteResponse>(`${API_BASE}/history`, { params });
    return res.data;
  },

  getVehicles: async (storeId?: string, status?: VehicleStatus): Promise<VehicleDto[]> => {
    const params: Record<string, string> = {};
    if (storeId) params.storeId = storeId;
    if (status) params.status = status;
    const res = await axios.get<VehicleDto[]>(`${API_BASE}/vehicles`, { params });
    return res.data;
  },

  createVehicle: async (data: CreateVehicleRequest): Promise<VehicleDto> => {
    const res = await axios.post<VehicleDto>(`${API_BASE}/vehicles`, data);
    return res.data;
  },

  updateVehicleStatus: async (id: string, status: VehicleStatus): Promise<VehicleDto> => {
    const res = await axios.patch<VehicleDto>(`${API_BASE}/vehicles/${id}/status`, null, {
      params: { status },
    });
    return res.data;
  },

  getMaintenanceAlerts: async (storeId?: string): Promise<FleetMaintenanceAlertDto[]> => {
    const params = storeId ? { storeId } : {};
    const res = await axios.get<FleetMaintenanceAlertDto[]>(`${API_BASE}/maintenance-alerts`, { params });
    return res.data;
  },

  recordVehicleService: async (id: string, data: RecordVehicleServiceRequest): Promise<VehicleDto> => {
    const res = await axios.post<VehicleDto>(`${API_BASE}/vehicles/${id}/service-log`, data);
    return res.data;
  },

  getBreakSchedules: async (storeId?: string): Promise<BreakScheduleDto[]> => {
    const params = storeId ? { storeId } : {};
    const res = await axios.get<BreakScheduleDto[]>(`${API_BASE}/break-schedules`, { params });
    return res.data;
  },

  createBreakSchedule: async (data: CreateBreakScheduleRequest): Promise<BreakScheduleDto> => {
    const res = await axios.post<BreakScheduleDto>(`${API_BASE}/break-schedules`, data);
    return res.data;
  },

  getLocationAuditLogs: async (): Promise<LocationAccessAuditLogDto[]> => {
    const res = await axios.get<LocationAccessAuditLogDto[]>(`${API_BASE}/audit-logs`);
    return res.data;
  },

  getFleetAnalytics: async (
    storeId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<FleetAnalyticsDto> => {
    const params: Record<string, string> = {};
    if (storeId) params.storeId = storeId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const res = await axios.get<FleetAnalyticsDto>(`${API_BASE}/analytics`, { params });
    return res.data;
  },
};
