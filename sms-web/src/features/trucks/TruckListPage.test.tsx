import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TruckListPage from "./TruckListPage";
import type { AvailableDriverDto, VehicleDto } from "../fleet/fleetApi";

const mockTrucks: VehicleDto[] = [
  {
    id: "trk-1",
    registrationNumber: "B 1234 ABC",
    brandModel: "Isuzu Elf NMR 71",
    vehicleType: "LIGHT_TRUCK_4W",
    status: "AVAILABLE",
    storeId: "store-1",
    storeName: "Central Warehouse",
    driverEmployeeId: "drv-1",
    driverName: "Budi Driver",
    driverEmployeeNumber: "DRV-001",
    taxDueDate: "2026-11-20",
    taxDaysRemaining: 20,
    taxDueStatus: "DUE_IN_ONE_MONTH",
    isTaxDueInOneMonth: true,
    stnkExpiryDate: "2029-11-20",
    stnkDaysRemaining: 1100,
  },
  {
    id: "trk-2",
    registrationNumber: "B 5678 XYZ",
    brandModel: "Mitsubishi Canter",
    vehicleType: "MEDIUM_TRUCK_6W",
    status: "IN_USE",
    storeId: "store-1",
    storeName: "Central Warehouse",
    driverEmployeeId: undefined,
    driverName: undefined,
    taxDueDate: "2026-10-15",
    taxDaysRemaining: -16,
    taxDueStatus: "OVERDUE",
    isTaxDueInOneMonth: true,
    stnkExpiryDate: "2026-11-10",
    stnkDaysRemaining: 10,
  },
];

const mockDrivers: AvailableDriverDto[] = [
  {
    employeeId: "drv-1",
    employeeNumber: "DRV-001",
    fullName: "Budi Driver",
    isAssigned: true,
    assignedVehicleId: "trk-1",
    assignedRegistrationNumber: "B 1234 ABC",
  },
  {
    employeeId: "drv-2",
    employeeNumber: "DRV-002",
    fullName: "Agus Santoso",
    isAssigned: false,
  },
];

vi.mock("./hooks", () => ({
  useTrucks: () => ({ data: mockTrucks, isLoading: false }),
  useAvailableDrivers: () => ({ data: mockDrivers, isLoading: false }),
  useCreateTruck: () => ({ mutateAsync: vi.fn() }),
  useUpdateTruck: () => ({ mutateAsync: vi.fn() }),
  useAssignDriver: () => ({ mutateAsync: vi.fn() }),
  useUnassignDriver: () => ({ mutateAsync: vi.fn() }),
  useChangeLicensePlate: () => ({ mutateAsync: vi.fn() }),
  usePlateHistory: () => ({ data: [], isLoading: false }),
  useServiceLogs: () => ({
    data: [
      {
        id: "svc-1",
        vehicleId: "trk-1",
        serviceDate: "2026-10-01",
        serviceType: "ROUTINE_MAINTENANCE",
        serviceCenterName: "Astra Isuzu Bengkel",
        odometerKm: 40000,
        costAmount: 1500000,
        invoiceNumber: "INV-001",
      },
    ],
    isLoading: false,
  }),
  useRecordServiceLog: () => ({ mutateAsync: vi.fn() }),
  useTruckTravelDistance: () => ({
    data: {
      vehicleId: "trk-1",
      vehicleRegistration: "B 1234 ABC",
      totalDeliveryDistanceKm: 14250.5,
      currentMonthDeliveryDistanceKm: 850.2,
      completedDeliveryTripsCount: 42,
      recentTrips: [],
    },
    isLoading: false,
  }),
  useMonthlyHealthChecks: () => ({
    data: [
      {
        id: "chk-1",
        vehicleId: "trk-1",
        checkDate: "2026-10-15",
        overallRating: "HEALTHY",
        inspectorName: "Rudi Inspector",
      },
    ],
    isLoading: false,
  }),
  useRecordMonthlyHealthCheck: () => ({ mutateAsync: vi.fn() }),
  useDriverLicenses: () => ({
    data: [
      {
        id: "lic-1",
        employeeId: "drv-1",
        driverName: "Budi Driver",
        licenseNumber: "SIM-987654321",
        licenseType: "SIM_B1_UMUM",
        expiryDate: "2026-11-20",
        daysRemaining: 20,
        status: "EXPIRING_SOON",
        issuingPoliceOffice: "Satpas Daan Mogot",
      },
    ],
    isLoading: false,
  }),
  useExpiringDriverLicenses: () => ({ data: [], isLoading: false }),
  useCreateDriverLicense: () => ({ mutateAsync: vi.fn() }),
  useUpdateDriverLicense: () => ({ mutateAsync: vi.fn() }),
  useDeleteDriverLicense: () => ({ mutateAsync: vi.fn() }),
  useSendLicenseRenewalReminder: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("../stores/hooks", () => ({
  useStores: () => ({ data: [{ id: "store-1", name: "Central Warehouse" }] }),
}));

vi.mock("notistack", () => ({
  useSnackbar: () => ({ enqueueSnackbar: vi.fn() }),
}));

function wrap(child: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{child}</QueryClientProvider>);
}

describe("TruckListPage - Master Data Truck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Master Data Truck header, KPI cards and truck rows", async () => {
    wrap(<TruckListPage />);

    expect(screen.getByText(/Master Data Truck/i)).toBeInTheDocument();
    expect(screen.getByText("B 1234 ABC")).toBeInTheDocument();
    expect(screen.getByText("Isuzu Elf NMR 71")).toBeInTheDocument();
    expect(screen.getByText("Budi Driver")).toBeInTheDocument();

    // Second truck with overdue tax and unassigned driver
    expect(screen.getByText("B 5678 XYZ")).toBeInTheDocument();
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });

  it("displays 1-month tax due alert badge and overdue indicator", async () => {
    wrap(<TruckListPage />);

    // Tax Due in 1 Month badge on trk-1
    expect(screen.getByText(/Due in 20d \(1-Mo\)/i)).toBeInTheDocument();

    // Overdue badge on trk-2
    expect(screen.getByText(/Overdue \(16d\)/i)).toBeInTheDocument();
  });

  it("opens Change License Plate dialog with current plate loaded", async () => {
    const user = userEvent.setup();
    wrap(<TruckListPage />);

    // Click change plate icon on first truck
    const changePlateButtons = screen.getAllByRole("button", { name: /Change License Plate/i });
    await user.click(changePlateButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Change License Plate \(Ganti Plat Nomor\)/i)).toBeInTheDocument();
      expect(screen.getByText("CURRENT PLATE")).toBeInTheDocument();
      expect(screen.getAllByText("B 1234 ABC").length).toBeGreaterThanOrEqual(2);
    });
  });

  it("filters trucks when clicking 1-month tax due filter chip", async () => {
    const user = userEvent.setup();
    wrap(<TruckListPage />);

    const filterChip = screen.getByRole("button", { name: /Tax Due in 1 Mo/i });
    await user.click(filterChip);

    // Only trk-1 should match DUE_IN_ONE_MONTH filter
    expect(screen.getByText("B 1234 ABC")).toBeInTheDocument();
    expect(screen.queryByText("B 5678 XYZ")).not.toBeInTheDocument();
  });

  it("opens Details & Inspections dialog with tabs for Service Logs, Travelled Distance, and Monthly Health Check", async () => {
    const user = userEvent.setup();
    wrap(<TruckListPage />);

    const detailsButtons = screen.getAllByRole("button", { name: /Service Logs, Distance & Monthly Inspections/i });
    await user.click(detailsButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Service Logs \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Travelled Distance \(GPS\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Monthly Health Check \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText("Astra Isuzu Bengkel")).toBeInTheDocument();
    });
  });
  it("opens Driver License (SIM) dialog and displays driver's driving license", async () => {
    const user = userEvent.setup();
    wrap(<TruckListPage />);

    // Click SIM badge button on driver Budi Driver
    const simButton = screen.getByRole("button", { name: /Driver's License \(SIM\) & Expiry Notifications/i });
    await user.click(simButton);

    await waitFor(() => {
      expect(screen.getByText(/Driving Licenses \(SIM\) — Budi Driver/i)).toBeInTheDocument();
      expect(screen.getByText("SIM-987654321")).toBeInTheDocument();
      expect(screen.getByText("SIM B1 UMUM")).toBeInTheDocument();
      expect(screen.getByText(/Expiring in 20d/i)).toBeInTheDocument();
    });
  });
});
