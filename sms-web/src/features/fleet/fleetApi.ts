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
  taxDueDate?: string;
  taxDaysRemaining?: number;
  taxDueStatus?: "OVERDUE" | "DUE_IN_ONE_MONTH" | "UP_TO_DATE";
  isTaxDueInOneMonth?: boolean;
  kirExpiryDate?: string;
  lastServiceOdometerKm?: number;
  lastServiceDate?: string;
  serviceIntervalKm?: number;
  isServiceDue?: boolean;
  stnkDaysRemaining?: number;
  kirDaysRemaining?: number;
  driverEmployeeId?: string;
  driverName?: string;
  driverEmployeeNumber?: string;
}


export type DriverLicenseType =
  | "SIM_A"
  | "SIM_B1"
  | "SIM_B1_UMUM"
  | "SIM_B2"
  | "SIM_B2_UMUM"
  | "SIM_C";

export interface DriverLicenseDto {
  id: string;
  employeeId: string;
  employeeNumber?: string;
  driverName?: string;
  licenseNumber: string;
  licenseType: DriverLicenseType;
  licenseTypeLabel?: string;
  issueDate?: string;
  expiryDate: string;
  issuingPoliceOffice?: string;
  photoUrl?: string;
  notes?: string;
  daysRemaining?: number;
  status: "VALID" | "EXPIRING_SOON" | "EXPIRED";
  lastNotificationSentAt?: string;
  createdAt: string;
}

export interface CreateDriverLicenseRequest {
  licenseNumber: string;
  licenseType: DriverLicenseType;
  issueDate?: string;
  expiryDate: string;
  issuingPoliceOffice?: string;
  photoUrl?: string;
  notes?: string;
}

export interface UpdateDriverLicenseRequest {
  licenseNumber: string;
  licenseType: DriverLicenseType;
  issueDate?: string;
  expiryDate: string;
  issuingPoliceOffice?: string;
  photoUrl?: string;
  notes?: string;
}

export interface AvailableDriverDto {
  employeeId: string;
  employeeNumber: string;
  fullName: string;
  phone?: string;
  isAssigned: boolean;
  assignedVehicleId?: string;
  assignedRegistrationNumber?: string;
  primaryLicenseNumber?: string;
  primaryLicenseType?: DriverLicenseType;
  primaryLicenseExpiryDate?: string;
  primaryLicenseDaysRemaining?: number;
  primaryLicenseStatus?: "VALID" | "EXPIRING_SOON" | "EXPIRED" | "NOT_RECORDED";
}

export interface UpdateVehicleRequest {
  storeId?: string;
  vehicleType: VehicleType;
  brandModel: string;
  chassisNumber?: string;
  engineNumber?: string;
  status?: VehicleStatus;
  maxPayloadKg?: number;
  maxVolumeCbm?: number;
  fuelType?: string;
  odometerKm?: number;
  taxDueDate?: string;
  stnkExpiryDate?: string;
  kirExpiryDate?: string;
  serviceIntervalKm?: number;
  driverEmployeeId?: string;
}

export interface ChangeLicensePlateRequest {
  newRegistrationNumber: string;
  changeDate: string;
  reason: string;
  notes?: string;
  newStnkExpiryDate?: string;
  newTaxDueDate?: string;
  changedByEmployeeId?: string;
}


export interface VehicleServiceLogDto {
  id: string;
  vehicleId: string;
  serviceDate: string;
  serviceType: string;
  serviceCenterName?: string;
  invoiceNumber?: string;
  odometerKm?: number;
  costAmount?: number;
  partsReplaced?: string;
  notes?: string;
  performedBy?: string;
  createdAt: string;
}

export interface CreateVehicleServiceLogRequest {
  serviceDate: string;
  serviceType: string;
  serviceCenterName?: string;
  invoiceNumber?: string;
  odometerKm?: number;
  costAmount?: number;
  partsReplaced?: string;
  notes?: string;
  performedBy?: string;
}

export interface VehicleMonthlyHealthCheckDto {
  id: string;
  vehicleId: string;
  checkDate: string;
  overallRating: "HEALTHY" | "ATTENTION_NEEDED" | "UNFIT_FOR_ROAD" | string;
  engineOilStatus?: string;
  coolantStatus?: string;
  brakeFluidStatus?: string;
  brakeCondition?: string;
  tireCondition?: string;
  batteryHealth?: string;
  lightsStatus?: string;
  safetyEquipmentStatus?: string;
  cargoBoxCondition?: string;
  actionRequired?: string;
  inspectorName?: string;
  odometerKm?: number;
  notes?: string;
  createdAt: string;
}

export interface CreateVehicleMonthlyHealthCheckRequest {
  checkDate: string;
  overallRating: string;
  engineOilStatus?: string;
  coolantStatus?: string;
  brakeFluidStatus?: string;
  brakeCondition?: string;
  tireCondition?: string;
  batteryHealth?: string;
  lightsStatus?: string;
  safetyEquipmentStatus?: string;
  cargoBoxCondition?: string;
  actionRequired?: string;
  inspectorName?: string;
  odometerKm?: number;
  notes?: string;
}

export interface DeliveryTripDistancePointDto {
  sessionId: string;
  taskCode?: string;
  driverName?: string;
  startTime?: string;
  endTime?: string;
  distanceKm?: number;
  durationMinutes?: number;
  status?: string;
}

export interface TruckTravelDistanceDto {
  vehicleId: string;
  vehicleRegistration: string;
  totalDeliveryDistanceKm: number;
  currentMonthDeliveryDistanceKm: number;
  completedDeliveryTripsCount: number;
  odometerKm?: number;
  lastServiceOdometerKm?: number;
  kmSinceLastService?: number;
  isServiceDue?: boolean;
  serviceIntervalKm?: number;
  recentTrips: DeliveryTripDistancePointDto[];
}

export interface VehiclePlateHistoryDto {
  id: string;
  vehicleId: string;
  oldRegistrationNumber: string;
  newRegistrationNumber: string;
  changeDate: string;
  reason: string;
  notes?: string;
  changedByEmployeeId?: string;
  changedByEmployeeName?: string;
  createdAt: string;
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
  taxDueDate?: string;
  stnkExpiryDate?: string;
  kirExpiryDate?: string;
  lastServiceOdometerKm?: number;
  lastServiceDate?: string;
  serviceIntervalKm?: number;
  driverEmployeeId?: string;
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

  getVehicle: async (id: string): Promise<VehicleDto> => {
    const res = await axios.get<VehicleDto>(`${API_BASE}/vehicles/${id}`);
    return res.data;
  },

  updateVehicle: async (id: string, data: UpdateVehicleRequest): Promise<VehicleDto> => {
    const res = await axios.put<VehicleDto>(`${API_BASE}/vehicles/${id}`, data);
    return res.data;
  },

  updateVehicleStatus: async (id: string, status: VehicleStatus): Promise<VehicleDto> => {
    const res = await axios.patch<VehicleDto>(`${API_BASE}/vehicles/${id}/status`, null, {
      params: { status },
    });
    return res.data;
  },

  assignDriver: async (vehicleId: string, driverEmployeeId?: string): Promise<VehicleDto> => {
    const params = driverEmployeeId ? { driverEmployeeId } : {};
    const res = await axios.post<VehicleDto>(`${API_BASE}/vehicles/${vehicleId}/driver`, null, { params });
    return res.data;
  },

  unassignDriver: async (vehicleId: string): Promise<VehicleDto> => {
    const res = await axios.delete<VehicleDto>(`${API_BASE}/vehicles/${vehicleId}/driver`);
    return res.data;
  },

  getAvailableDrivers: async (vehicleId?: string): Promise<AvailableDriverDto[]> => {
    const params = vehicleId ? { vehicleId } : {};
    const res = await axios.get<AvailableDriverDto[]>(`${API_BASE}/available-drivers`, { params });
    return res.data;
  },

  changeLicensePlate: async (vehicleId: string, data: ChangeLicensePlateRequest): Promise<VehicleDto> => {
    const res = await axios.post<VehicleDto>(`${API_BASE}/vehicles/${vehicleId}/change-plate`, data);
    return res.data;
  },

  getPlateHistory: async (vehicleId: string): Promise<VehiclePlateHistoryDto[]> => {
    const res = await axios.get<VehiclePlateHistoryDto[]>(`${API_BASE}/vehicles/${vehicleId}/plate-history`);
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

  getServiceLogs: async (vehicleId: string): Promise<VehicleServiceLogDto[]> => {
    const res = await axios.get<VehicleServiceLogDto[]>(`${API_BASE}/vehicles/${vehicleId}/service-logs`);
    return res.data;
  },

  createServiceLog: async (
    vehicleId: string,
    data: CreateVehicleServiceLogRequest
  ): Promise<VehicleServiceLogDto> => {
    const res = await axios.post<VehicleServiceLogDto>(`${API_BASE}/vehicles/${vehicleId}/service-logs`, data);
    return res.data;
  },

  getMonthlyHealthChecks: async (vehicleId: string): Promise<VehicleMonthlyHealthCheckDto[]> => {
    const res = await axios.get<VehicleMonthlyHealthCheckDto[]>(`${API_BASE}/vehicles/${vehicleId}/monthly-health-checks`);
    return res.data;
  },

  createMonthlyHealthCheck: async (
    vehicleId: string,
    data: CreateVehicleMonthlyHealthCheckRequest
  ): Promise<VehicleMonthlyHealthCheckDto> => {
    const res = await axios.post<VehicleMonthlyHealthCheckDto>(
      `${API_BASE}/vehicles/${vehicleId}/monthly-health-checks`,
      data
    );
    return res.data;
  },

  getTruckTravelDistance: async (vehicleId: string): Promise<TruckTravelDistanceDto> => {
    const res = await axios.get<TruckTravelDistanceDto>(`${API_BASE}/vehicles/${vehicleId}/travel-distance`);
    return res.data;
  },

  getDriverLicenses: async (employeeId: string): Promise<DriverLicenseDto[]> => {
    const res = await axios.get<DriverLicenseDto[]>(`${API_BASE}/drivers/${employeeId}/licenses`);
    return res.data;
  },

  createDriverLicense: async (
    employeeId: string,
    data: CreateDriverLicenseRequest
  ): Promise<DriverLicenseDto> => {
    const res = await axios.post<DriverLicenseDto>(`${API_BASE}/drivers/${employeeId}/licenses`, data);
    return res.data;
  },

  updateDriverLicense: async (
    licenseId: string,
    data: UpdateDriverLicenseRequest
  ): Promise<DriverLicenseDto> => {
    const res = await axios.put<DriverLicenseDto>(`${API_BASE}/driver-licenses/${licenseId}`, data);
    return res.data;
  },

  deleteDriverLicense: async (licenseId: string): Promise<void> => {
    await axios.delete(`${API_BASE}/driver-licenses/${licenseId}`);
  },

  sendLicenseRenewalReminder: async (licenseId: string): Promise<DriverLicenseDto> => {
    const res = await axios.post<DriverLicenseDto>(`${API_BASE}/driver-licenses/${licenseId}/send-reminder`);
    return res.data;
  },

  getExpiringDriverLicenses: async (): Promise<DriverLicenseDto[]> => {
    const res = await axios.get<DriverLicenseDto[]>(`${API_BASE}/driver-licenses/expiring`);
    return res.data;
  },
};
