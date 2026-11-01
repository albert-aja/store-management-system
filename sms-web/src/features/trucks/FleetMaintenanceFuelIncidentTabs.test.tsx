import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MaintenanceScheduleTabContent,
  FuelLogTabContent,
  IncidentReportTabContent,
} from "./FleetMaintenanceFuelIncidentTabs";
import type { VehicleDto } from "../fleet/fleetApi";

const mockTruck: VehicleDto = {
  id: "trk-1",
  registrationNumber: "B 1234 ABC",
  brandModel: "Isuzu Elf NMR 71",
  vehicleType: "LIGHT_TRUCK_4W",
  status: "AVAILABLE",
  odometerKm: 25000,
  driverEmployeeId: "drv-1",
  driverName: "Budi Driver",
};

const mockSchedules = [
  {
    id: "sch-1",
    vehicleId: "trk-1",
    registrationNumber: "B 1234 ABC",
    scheduledDate: "2026-11-10",
    maintenanceType: "ROUTINE_SERVICE",
    targetOdometerKm: 20000,
    estimatedCost: 1500000,
    actualCost: undefined,
    serviceCenter: "Astra Isuzu Daan Mogot",
    status: "SCHEDULED",
    isDueOrOverdue: true,
    createdAt: "2026-11-01T00:00:00Z",
  },
  {
    id: "sch-2",
    vehicleId: "trk-1",
    registrationNumber: "B 1234 ABC",
    scheduledDate: "2026-10-01",
    maintenanceType: "OIL_CHANGE",
    targetOdometerKm: 15000,
    estimatedCost: 800000,
    actualCost: 850000,
    serviceCenter: "Bengkel Sentosa",
    status: "COMPLETED",
    isDueOrOverdue: false,
    createdAt: "2026-09-20T00:00:00Z",
  },
];

const mockFuelLogs = [
  {
    id: "fuel-1",
    vehicleId: "trk-1",
    registrationNumber: "B 1234 ABC",
    driverEmployeeId: "drv-1",
    driverName: "Budi Driver",
    logDate: "2026-11-01",
    odometerKm: 25000,
    fuelLiters: 50.0,
    costPerLiter: 6800.0,
    totalCost: 340000.0,
    fuelType: "SOLAR",
    gasStationName: "SPBU Pertamina 34-11401",
    fullTank: true,
    efficiencyKmPerLiter: 10.5,
    invoiceNumber: "INV-SPBU-01",
    createdAt: "2026-11-01T06:00:00Z",
  },
];

const mockIncidents = [
  {
    id: "inc-1",
    vehicleId: "trk-1",
    registrationNumber: "B 1234 ABC",
    reporterEmployeeId: "drv-1",
    reporterName: "Budi Driver",
    incidentDate: "2026-10-28",
    incidentType: "COLLISION_MINOR",
    severity: "MEDIUM",
    location: "Jl. Daan Mogot KM 12",
    description: "Bumper depan terserempet saat manuver parkir di gang sempit",
    thirdPartyInvolved: false,
    estimatedRepairCost: 2500000,
    actualRepairCost: undefined,
    insuranceClaimed: true,
    insuranceClaimNumber: "CLM-0091",
    status: "REPORTED",
    createdAt: "2026-10-28T10:00:00Z",
  },
];

const mockCreateSchedule = vi.fn();
const mockUpdateSchedule = vi.fn();
const mockRecordFuel = vi.fn();
const mockReportIncident = vi.fn();
const mockUpdateIncident = vi.fn();

vi.mock("./hooks", () => ({
  useMaintenanceSchedules: () => ({ data: mockSchedules, isLoading: false }),
  useCreateMaintenanceSchedule: () => ({ mutateAsync: mockCreateSchedule }),
  useUpdateMaintenanceScheduleStatus: () => ({ mutateAsync: mockUpdateSchedule }),
  useFuelLogs: () => ({ data: mockFuelLogs, isLoading: false }),
  useRecordFuelLog: () => ({ mutateAsync: mockRecordFuel }),
  useIncidentReports: () => ({ data: mockIncidents, isLoading: false }),
  useReportIncident: () => ({ mutateAsync: mockReportIncident }),
  useUpdateIncidentStatus: () => ({ mutateAsync: mockUpdateIncident }),
}));

vi.mock("notistack", () => ({
  useSnackbar: () => ({ enqueueSnackbar: vi.fn() }),
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("FleetMaintenanceFuelIncidentTabs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("MaintenanceScheduleTabContent", () => {
    it("renders scheduled bookings, due alert banner, and schedule button", async () => {
      renderWithClient(<MaintenanceScheduleTabContent truck={mockTruck} />);

      expect(screen.getByText("Vehicle Maintenance Schedule")).toBeInTheDocument();
      expect(screen.getByText("Total Scheduled Bookings")).toBeInTheDocument();
      expect(screen.getByText("Astra Isuzu Daan Mogot")).toBeInTheDocument();
      expect(screen.getByText("Due / Overdue Tasks")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Schedule Maintenance/i })).toBeInTheDocument();
    });

    it("opens schedule maintenance dialog when button is clicked", async () => {
      const user = userEvent.setup();
      renderWithClient(<MaintenanceScheduleTabContent truck={mockTruck} />);

      await user.click(screen.getByRole("button", { name: /Schedule Maintenance/i }));

      expect(screen.getByText("Schedule Vehicle Maintenance")).toBeInTheDocument();
      expect(screen.getByLabelText(/Scheduled Date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Target Odometer/i)).toBeInTheDocument();
    });
  });

  describe("FuelLogTabContent", () => {
    it("renders fuel consumption KPI summary and fuel refill table", async () => {
      renderWithClient(<FuelLogTabContent truck={mockTruck} />);

      expect(screen.getByText("Fuel Consumption Log Tracking")).toBeInTheDocument();
      expect(screen.getByText("Total Fuel Spend")).toBeInTheDocument();
      expect(screen.getByText("Average Fuel Economy")).toBeInTheDocument();
      expect(screen.getAllByText("10.5 km/L").length).toBeGreaterThan(0);
      expect(screen.getByText("SPBU Pertamina 34-11401")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Record Fuel Refill/i })).toBeInTheDocument();
    });

    it("opens record fuel refill dialog when button is clicked", async () => {
      const user = userEvent.setup();
      renderWithClient(<FuelLogTabContent truck={mockTruck} />);

      await user.click(screen.getByRole("button", { name: /Record Fuel Refill/i }));

      expect(screen.getByText("Record Fuel Consumption Refill")).toBeInTheDocument();
      expect(screen.getByLabelText(/Fuel Volume \(Liters\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Price per Liter/i)).toBeInTheDocument();
    });
  });

  describe("IncidentReportTabContent", () => {
    it("renders damage incidents table, severity badge, and repair cost", async () => {
      renderWithClient(<IncidentReportTabContent truck={mockTruck} />);

      expect(screen.getByText("Vehicle Incident & Damage Reports")).toBeInTheDocument();
      expect(screen.getByText("Total Incident Reports")).toBeInTheDocument();
      expect(screen.getByText("Total Repair Cost Exposure")).toBeInTheDocument();
      expect(screen.getByText("MEDIUM")).toBeInTheDocument();
      expect(screen.getByText(/Bumper depan terserempet/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Report Damage Incident/i })).toBeInTheDocument();
    });

    it("opens damage incident report dialog when button is clicked", async () => {
      const user = userEvent.setup();
      renderWithClient(<IncidentReportTabContent truck={mockTruck} />);

      await user.click(screen.getByRole("button", { name: /Report Damage Incident/i }));

      expect(screen.getByText(/Report Vehicle Damage \/ Incident/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Incident Description \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Estimated Repair Cost/i)).toBeInTheDocument();
    });
  });
});
