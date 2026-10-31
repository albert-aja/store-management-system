import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FleetMonitoringPage from "./FleetMonitoringPage";
import { fleetApi } from "./fleetApi";

vi.mock("notistack", () => ({
  useSnackbar: () => ({
    enqueueSnackbar: vi.fn(),
  }),
}));

const mockLiveFleet = [
  {
    employeeId: "emp-101",
    employeeName: "Budi Santoso",
    employeeRole: "DRIVER",
    sessionId: "sess-001",
    trackingStatus: "ACTIVE" as const,
    taskType: "DELIVERY_TRIP" as const,
    taskCode: "DT-000001",
    vehicleId: "veh-001",
    vehicleRegistrationNumber: "B 9283 TXT",
    latitude: -6.182,
    longitude: 106.835,
    accuracyMeters: 12.5,
    speedKmh: 32.5,
    headingDegrees: 85.0,
    batteryLevelPct: 88,
    lastPingAt: "2026-10-30T10:15:30Z",
  },
  {
    employeeId: "emp-102",
    employeeName: "Siti Rahma",
    employeeRole: "SURVEYOR",
    sessionId: "sess-002",
    trackingStatus: "ACTIVE" as const,
    taskType: "SURVEY_TASK" as const,
    taskCode: "SV-000042",
    latitude: -6.168,
    longitude: 106.819,
    accuracyMeters: 8.0,
    speedKmh: 14.0,
    headingDegrees: 310.0,
    batteryLevelPct: 92,
    lastPingAt: "2026-10-30T10:15:45Z",
  },
  {
    employeeId: "emp-103",
    employeeName: "Ahmad Dahlan",
    employeeRole: "COLLECTOR",
    sessionId: "sess-003",
    trackingStatus: "PAUSED" as const,
    taskType: "COLLECTION_TASK" as const,
    taskCode: "CT-000019",
    latitude: -6.195,
    longitude: 106.842,
    accuracyMeters: 15.0,
    speedKmh: 0.0,
    headingDegrees: 0.0,
    batteryLevelPct: 65,
    lastPingAt: "2026-10-30T10:14:00Z",
  },
];

const mockVehicles = [
  {
    id: "veh-001",
    registrationNumber: "B 9283 TXT",
    vehicleType: "BLIND_VAN" as const,
    brandModel: "Daihatsu Gran Max 1.3 D",
    status: "IN_USE" as const,
    maxPayloadKg: 850,
    maxVolumeCbm: 4.2,
    fuelType: "GASOLINE_RON90",
    odometerKm: 34200,
    stnkExpiryDate: "2026-11-14",
    kirExpiryDate: "2026-11-05",
    stnkDaysRemaining: 15,
    kirDaysRemaining: 6,
    isServiceDue: true,
  },
];

const mockAlerts = [
  {
    vehicleId: "veh-001",
    registrationNumber: "B 9283 TXT",
    brandModel: "Daihatsu Gran Max 1.3 D",
    vehicleType: "BLIND_VAN" as const,
    alertType: "STNK_EXPIRING" as const,
    severity: "WARNING" as const,
    message: "STNK expires in 15 days on 2026-11-14",
    daysRemaining: 15,
  },
];

const mockHistory = {
  sessionId: "sess-001",
  employeeId: "emp-101",
  employeeName: "Budi Santoso",
  employeeRole: "DRIVER",
  taskType: "DELIVERY_TRIP" as const,
  taskCode: "DT-000001",
  vehicleRegistrationNumber: "B 9283 TXT",
  startTime: "2026-10-30T08:00:00Z",
  endTime: "2026-10-30T11:30:00Z",
  totalDistanceKm: 18.5,
  activeDurationMinutes: 150,
  pausedDurationMinutes: 60,
  routePoints: [
    { latitude: -6.1754, longitude: 106.8272, recordedAt: "2026-10-30T08:00:00Z" },
    { latitude: -6.182, longitude: 106.835, recordedAt: "2026-10-30T08:15:00Z" },
  ],
  events: [
    {
      id: "evt-1",
      eventType: "SESSION_STARTED" as const,
      eventTimestamp: "2026-10-30T08:00:00Z",
      notes: "Trip DT-000001 started",
    },
    {
      id: "evt-2",
      eventType: "SCHEDULED_BREAK_PAUSE" as const,
      eventTimestamp: "2026-10-30T12:00:00Z",
      notes: "Lunch break pause automatically enforced",
    },
  ],
};

const mockBreaks = [
  {
    id: "brk-001",
    name: "Istirahat Siang",
    employeeRole: "ALL",
    startTime: "12:00",
    endTime: "13:00",
    active: true,
  },
];

const mockAuditLogs = [
  {
    id: "aud-001",
    actorEmployeeId: "mgr-001",
    actorEmployeeName: "Supervisor Rudi",
    targetEmployeeId: "emp-101",
    targetEmployeeName: "Budi Santoso",
    queryType: "LIVE_MONITOR_VIEW" as const,
    timestamp: "2026-10-30T10:15:00Z",
    ipAddress: "192.168.1.10",
  },
];

const mockAnalytics = {
  startDate: "2026-10-23",
  endDate: "2026-10-30",
  totalDistanceKm: 184.6,
  totalActiveHours: 46.5,
  totalPausedHours: 8.2,
  completedTripsCount: 14,
  completedDeliveriesCount: 48,
  completedSurveysCount: 22,
  completedCollectionsCount: 35,
  avgVisitDurationMinutes: 24.5,
  avgTransitDurationMinutes: 32.0,
  overallVehicleUtilizationPct: 78.4,
  vehicleUtilization: [
    {
      registrationNumber: "B 9142 SXZ",
      brandModel: "Daihatsu Gran Max",
      vehicleType: "BLIND_VAN",
      totalTrips: 8,
      totalDistanceKm: 86.4,
      activeHours: 22.5,
      utilizationPct: 82.0,
      status: "AVAILABLE",
    },
  ],
  roleProductivity: [
    {
      role: "DRIVER",
      activeStaffCount: 4,
      tasksCompleted: 48,
      totalDistanceKm: 126.5,
      avgTaskDurationMinutes: 38.0,
      avgTransitDurationMinutes: 28.5,
      efficiencyRating: 94.2,
    },
  ],
  interruptionCounts: {
    SCHEDULED_BREAK: 18,
    MANUAL_PAUSE: 4,
    LOW_BATTERY_THROTTLE: 3,
    SIGNAL_LOSS: 2,
  },
  ethicalDecisionNotice:
    "STATUTORY & ETHICAL OPERATIONAL NOTICE: GPS-derived telemetry reflects automated machine observations only and must NEVER be used as the sole or definitive basis for punitive employee action.",
};

describe("FleetMonitoringPage", () => {
  beforeEach(() => {
    vi.spyOn(fleetApi, "getLiveFleet").mockResolvedValue(mockLiveFleet);
    vi.spyOn(fleetApi, "getVehicles").mockResolvedValue(mockVehicles);
    vi.spyOn(fleetApi, "getMaintenanceAlerts").mockResolvedValue(mockAlerts);
    vi.spyOn(fleetApi, "getHistoricalRoute").mockResolvedValue(mockHistory);
    vi.spyOn(fleetApi, "getBreakSchedules").mockResolvedValue(mockBreaks);
    vi.spyOn(fleetApi, "getLocationAuditLogs").mockResolvedValue(mockAuditLogs);
    vi.spyOn(fleetApi, "getFleetAnalytics").mockResolvedValue(mockAnalytics);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders page header and active staff in live monitor", async () => {
    render(<FleetMonitoringPage />);

    expect(
      await screen.findByText(/Logistics & Fleet Management System/i),
    ).toBeInTheDocument();

    // Verify staff cards in roster
    expect(await screen.findByText("Budi Santoso")).toBeInTheDocument();
    expect(screen.getByText("Siti Rahma")).toBeInTheDocument();
    expect(screen.getByText("Ahmad Dahlan")).toBeInTheDocument();
  });

  it("switches to Historical Route Playback tab and displays metrics", async () => {
    const user = userEvent.setup();
    render(<FleetMonitoringPage />);

    const playbackTab = screen.getByRole("tab", { name: /Historical Route Playback/i });
    await user.click(playbackTab);

    // Verify UU PDP notice
    expect(
      await screen.findByText(/UU PDP No. 27\/2022 Compliance Notice/i),
    ).toBeInTheDocument();

    // Verify total distance and waypoints
    expect(await screen.findByText(/18.5 km/i)).toBeInTheDocument();
    expect(screen.getByText(/2 GPS Waypoints/i)).toBeInTheDocument();
  });

  it("switches to Vehicle Fleet Registry tab and displays vehicle list with maintenance alerts and service badges", async () => {
    const user = userEvent.setup();
    render(<FleetMonitoringPage />);

    const vehicleTab = screen.getByRole("tab", { name: /Vehicle Fleet Registry/i });
    await user.click(vehicleTab);

    expect(await screen.findByText("B 9283 TXT")).toBeInTheDocument();
    expect(screen.getByText("Daihatsu Gran Max 1.3 D")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Vehicle/i })).toBeInTheDocument();

    // Verify Maintenance Alert Banner
    expect(
      await screen.findByText(/Fleet Maintenance & Document Expiration Warnings/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/STNK expires in 15 days on 2026-11-14/i)).toBeInTheDocument();

    // Verify Badges
    expect(screen.getAllByText("Service Due").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Expiring \(15 days\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Critical \(6 days\)/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Service/i })).toBeInTheDocument();
  });

  it("switches to Scheduled Breaks & Privacy Audit tab and displays policy and audit log", async () => {
    const user = userEvent.setup();
    render(<FleetMonitoringPage />);

    const auditTab = screen.getByRole("tab", { name: /Scheduled Breaks & Privacy Audit/i });
    await user.click(auditTab);

    expect(
      await screen.findByText(/Strict Scheduled Breaks Policy/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Istirahat Siang")).toBeInTheDocument();
    expect(screen.getByText("Supervisor Rudi")).toBeInTheDocument();
    expect(screen.getByText(/LIVE MONITOR VIEW/i)).toBeInTheDocument();
  });

  it("switches to Fleet Analytics & Productivity tab and renders metrics and ethical notice", async () => {
    const user = userEvent.setup();
    render(<FleetMonitoringPage />);

    const analyticsTab = screen.getByRole("tab", { name: /Fleet Analytics & Productivity/i });
    await user.click(analyticsTab);

    expect(
      await screen.findByText(/STATUTORY ETHICAL DECISION SUPPORT STANDARD/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/184.6 km/i)).toBeInTheDocument();
    expect(screen.getByText(/78.4%/i)).toBeInTheDocument();
    expect(screen.getByText(/B 9142 SXZ/i)).toBeInTheDocument();
    expect(screen.getByText(/Export CSV Report/i)).toBeInTheDocument();
  });
});
