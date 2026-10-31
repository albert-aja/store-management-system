import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fleetApi,
  type AvailableDriverDto,
  type DriverLicenseDto,
  type CreateDriverLicenseRequest,
  type UpdateDriverLicenseRequest,
  type ChangeLicensePlateRequest,
  type CreateVehicleServiceLogRequest,
  type CreateVehicleMonthlyHealthCheckRequest,
  type VehicleServiceLogDto,
  type VehicleMonthlyHealthCheckDto,
  type TruckTravelDistanceDto,
  type CreateVehicleRequest,
  type UpdateVehicleRequest,
  type VehicleDto,
  type VehiclePlateHistoryDto,
  type VehicleStatus,
} from "../fleet/fleetApi";

const TRUCKS_KEY = ["trucks"];
const truckKey = (id: string) => ["truck", id];
const AVAILABLE_DRIVERS_KEY = ["available-drivers"];
const plateHistoryKey = (id: string) => ["plate-history", id];
const serviceLogsKey = (id: string) => ["truck-service-logs", id];
const healthChecksKey = (id: string) => ["truck-health-checks", id];
const travelDistanceKey = (id: string) => ["truck-travel-distance", id];
const driverLicensesKey = (employeeId: string) => ["driver-licenses", employeeId];
const expiringLicensesKey = ["driver-licenses-expiring"];



export function useTrucks(params?: { storeId?: string; status?: VehicleStatus }) {
  return useQuery<VehicleDto[]>({
    queryKey: [...TRUCKS_KEY, params?.storeId, params?.status],
    queryFn: () => fleetApi.getVehicles(params?.storeId, params?.status),
  });
}

export function useTruck(id: string | null) {
  return useQuery<VehicleDto>({
    queryKey: truckKey(id ?? ""),
    queryFn: () => fleetApi.getVehicle(id as string),
    enabled: !!id,
  });
}

export function useAvailableDrivers(vehicleId?: string) {
  return useQuery<AvailableDriverDto[]>({
    queryKey: [...AVAILABLE_DRIVERS_KEY, vehicleId],
    queryFn: () => fleetApi.getAvailableDrivers(vehicleId),
  });
}

export function usePlateHistory(vehicleId: string | null) {
  return useQuery<VehiclePlateHistoryDto[]>({
    queryKey: plateHistoryKey(vehicleId ?? ""),
    queryFn: () => fleetApi.getPlateHistory(vehicleId as string),
    enabled: !!vehicleId,
  });
}

export function useCreateTruck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVehicleRequest) => fleetApi.createVehicle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRUCKS_KEY });
      queryClient.invalidateQueries({ queryKey: AVAILABLE_DRIVERS_KEY });
    },
  });
}

export function useUpdateTruck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVehicleRequest }) =>
      fleetApi.updateVehicle(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: TRUCKS_KEY });
      queryClient.invalidateQueries({ queryKey: truckKey(vars.id) });
      queryClient.invalidateQueries({ queryKey: AVAILABLE_DRIVERS_KEY });
    },
  });
}

export function useAssignDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicleId, driverEmployeeId }: { vehicleId: string; driverEmployeeId?: string }) =>
      fleetApi.assignDriver(vehicleId, driverEmployeeId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: TRUCKS_KEY });
      queryClient.invalidateQueries({ queryKey: truckKey(vars.vehicleId) });
      queryClient.invalidateQueries({ queryKey: AVAILABLE_DRIVERS_KEY });
    },
  });
}

export function useUnassignDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vehicleId: string) => fleetApi.unassignDriver(vehicleId),
    onSuccess: (_, vehicleId) => {
      queryClient.invalidateQueries({ queryKey: TRUCKS_KEY });
      queryClient.invalidateQueries({ queryKey: truckKey(vehicleId) });
      queryClient.invalidateQueries({ queryKey: AVAILABLE_DRIVERS_KEY });
    },
  });
}

export function useChangeLicensePlate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicleId, data }: { vehicleId: string; data: ChangeLicensePlateRequest }) =>
      fleetApi.changeLicensePlate(vehicleId, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: TRUCKS_KEY });
      queryClient.invalidateQueries({ queryKey: truckKey(vars.vehicleId) });
      queryClient.invalidateQueries({ queryKey: plateHistoryKey(vars.vehicleId) });
    },
  });
}


export function useServiceLogs(vehicleId: string | null) {
  return useQuery<VehicleServiceLogDto[]>({
    queryKey: serviceLogsKey(vehicleId ?? ""),
    queryFn: () => fleetApi.getServiceLogs(vehicleId as string),
    enabled: !!vehicleId,
  });
}

export function useRecordServiceLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicleId, data }: { vehicleId: string; data: CreateVehicleServiceLogRequest }) =>
      fleetApi.createServiceLog(vehicleId, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: TRUCKS_KEY });
      queryClient.invalidateQueries({ queryKey: truckKey(vars.vehicleId) });
      queryClient.invalidateQueries({ queryKey: serviceLogsKey(vars.vehicleId) });
      queryClient.invalidateQueries({ queryKey: travelDistanceKey(vars.vehicleId) });
    },
  });
}

export function useMonthlyHealthChecks(vehicleId: string | null) {
  return useQuery<VehicleMonthlyHealthCheckDto[]>({
    queryKey: healthChecksKey(vehicleId ?? ""),
    queryFn: () => fleetApi.getMonthlyHealthChecks(vehicleId as string),
    enabled: !!vehicleId,
  });
}

export function useRecordMonthlyHealthCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicleId, data }: { vehicleId: string; data: CreateVehicleMonthlyHealthCheckRequest }) =>
      fleetApi.createMonthlyHealthCheck(vehicleId, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: TRUCKS_KEY });
      queryClient.invalidateQueries({ queryKey: truckKey(vars.vehicleId) });
      queryClient.invalidateQueries({ queryKey: healthChecksKey(vars.vehicleId) });
    },
  });
}

export function useTruckTravelDistance(vehicleId: string | null) {
  return useQuery<TruckTravelDistanceDto>({
    queryKey: travelDistanceKey(vehicleId ?? ""),
    queryFn: () => fleetApi.getTruckTravelDistance(vehicleId as string),
    enabled: !!vehicleId,
  });
}


export function useDriverLicenses(employeeId: string | null) {
  return useQuery<DriverLicenseDto[]>({
    queryKey: driverLicensesKey(employeeId ?? ""),
    queryFn: () => fleetApi.getDriverLicenses(employeeId as string),
    enabled: !!employeeId,
  });
}

export function useExpiringDriverLicenses() {
  return useQuery<DriverLicenseDto[]>({
    queryKey: expiringLicensesKey,
    queryFn: () => fleetApi.getExpiringDriverLicenses(),
  });
}

export function useCreateDriverLicense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, data }: { employeeId: string; data: CreateDriverLicenseRequest }) =>
      fleetApi.createDriverLicense(employeeId, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: driverLicensesKey(vars.employeeId) });
      queryClient.invalidateQueries({ queryKey: expiringLicensesKey });
      queryClient.invalidateQueries({ queryKey: AVAILABLE_DRIVERS_KEY });
      queryClient.invalidateQueries({ queryKey: TRUCKS_KEY });
    },
  });
}

export function useUpdateDriverLicense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ licenseId, employeeId: _employeeId, data }: { licenseId: string; employeeId: string; data: UpdateDriverLicenseRequest }) =>
      fleetApi.updateDriverLicense(licenseId, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: driverLicensesKey(vars.employeeId) });
      queryClient.invalidateQueries({ queryKey: expiringLicensesKey });
      queryClient.invalidateQueries({ queryKey: AVAILABLE_DRIVERS_KEY });
      queryClient.invalidateQueries({ queryKey: TRUCKS_KEY });
    },
  });
}

export function useDeleteDriverLicense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ licenseId, employeeId: _employeeId }: { licenseId: string; employeeId: string }) =>
      fleetApi.deleteDriverLicense(licenseId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: driverLicensesKey(vars.employeeId) });
      queryClient.invalidateQueries({ queryKey: expiringLicensesKey });
      queryClient.invalidateQueries({ queryKey: AVAILABLE_DRIVERS_KEY });
      queryClient.invalidateQueries({ queryKey: TRUCKS_KEY });
    },
  });
}

export function useSendLicenseRenewalReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ licenseId, employeeId: _employeeId }: { licenseId: string; employeeId: string }) =>
      fleetApi.sendLicenseRenewalReminder(licenseId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: driverLicensesKey(vars.employeeId) });
      queryClient.invalidateQueries({ queryKey: expiringLicensesKey });
    },
  });
}
