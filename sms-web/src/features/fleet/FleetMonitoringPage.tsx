import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Slider,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import SecurityIcon from "@mui/icons-material/Security";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DownloadIcon from "@mui/icons-material/Download";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { useSnackbar } from "notistack";
import FleetLiveMap from "./FleetLiveMap";
import LocationMap from "../../components/LocationMap";
import VehicleFormDialog from "./VehicleFormDialog";
import {
  type BreakScheduleDto,
  type HistoricalRouteResponse,
  type LiveFleetStatusDto,
  type LocationAccessAuditLogDto,
  type VehicleDto,
  type VehicleStatus,
  type FleetAnalyticsDto,
  type FleetMaintenanceAlertDto,
  fleetApi,
} from "./fleetApi";
import { t , formatDate, formatNumber, localizeDisplayCode} from "../../lib/locale";

export default function FleetMonitoringPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { enqueueSnackbar } = useSnackbar();

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<number>(0);

  // Live Fleet state
  const [liveFleet, setLiveFleet] = useState<LiveFleetStatusDto[]>([]);
  const [loadingLive, setLoadingLive] = useState<boolean>(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [rosterSearch, setRosterSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Historical Route state
  const [historyData, setHistoryData] = useState<HistoricalRouteResponse | null>(null);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [playbackIndex, setPlaybackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Vehicle Registry state
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState<boolean>(false);
  const [vehicleSearch, setVehicleSearch] = useState<string>("");
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState<string>("ALL");
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState<boolean>(false);

  // Maintenance & Expiry Alerts state
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<FleetMaintenanceAlertDto[]>([]);
  const [maintenanceFilter, setMaintenanceFilter] = useState<"ALL" | "EXPIRING_SOON" | "SERVICE_DUE">("ALL");
  const [serviceDialogOpen, setServiceDialogOpen] = useState<boolean>(false);
  const [selectedVehicleForService, setSelectedVehicleForService] = useState<VehicleDto | null>(null);
  const [serviceDate, setServiceDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [serviceOdometer, setServiceOdometer] = useState<number>(0);
  const [serviceInterval, setServiceInterval] = useState<number>(10000);
  const [serviceNotes, setServiceNotes] = useState<string>("");
  const [serviceSubmitting, setServiceSubmitting] = useState<boolean>(false);

  // Break Schedule & Audit state
  const [breakSchedules, setBreakSchedules] = useState<BreakScheduleDto[]>([]);
  const [auditLogs, setAuditLogs] = useState<LocationAccessAuditLogDto[]>([]);
  const [breakDialogOpen, setBreakDialogOpen] = useState<boolean>(false);
  const [newBreakName, setNewBreakName] = useState<string>("");
  const [newBreakRole, setNewBreakRole] = useState<string>("");
  const [newBreakStart, setNewBreakStart] = useState<string>("12:00");
  const [newBreakEnd, setNewBreakEnd] = useState<string>("13:00");

  // Analytics & Productivity state
  const [analyticsData, setAnalyticsData] = useState<FleetAnalyticsDto | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(false);
  const [analyticsStartDate, setAnalyticsStartDate] = useState<string>(() => {
    return new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  });
  const [analyticsEndDate, setAnalyticsEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  const fetchAnalytics = async (startDate?: string, endDate?: string) => {
    setLoadingAnalytics(true);
    try {
      const data = await fleetApi.getFleetAnalytics(
        undefined,
        startDate ?? analyticsStartDate,
        endDate ?? analyticsEndDate
      );
      setAnalyticsData(data);
    } catch {
      enqueueSnackbar(t("Failed to load fleet operational analytics"), { variant: "error" });
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleExportCsv = () => {
    if (!analyticsData) return;
    const rows = [
      [
        t("Operational Metrics Report"),
        t("Period: {start} to {end}", undefined, {
          start: formatDate(analyticsData.startDate),
          end: formatDate(analyticsData.endDate),
        }),
      ],
      [],
      [t("METRIC"), t("VALUE")],
      [t("Total Fleet Distance (km)"), String(analyticsData.totalDistanceKm)],
      [t("Total Active Operating Hours"), String(analyticsData.totalActiveHours)],
      [t("Total Paused Hours"), String(analyticsData.totalPausedHours)],
      [t("Completed Trips"), String(analyticsData.completedTripsCount)],
      [t("Completed Deliveries"), String(analyticsData.completedDeliveriesCount)],
      [t("Completed Surveys"), String(analyticsData.completedSurveysCount)],
      [t("Completed Collections"), String(analyticsData.completedCollectionsCount)],
      [t("Average Visit Duration (mins)"), String(analyticsData.avgVisitDurationMinutes)],
      [t("Average Transit Duration (mins)"), String(analyticsData.avgTransitDurationMinutes)],
      [t("Overall Fleet Utilization Rate (%)"), String(analyticsData.overallVehicleUtilizationPct)],
      [],
      [t("ROLE PRODUCTIVITY SUMMARY")],
      [
        t("Role"),
        t("Active Staff"),
        t("Tasks Completed"),
        t("Distance (km)"),
        t("Avg Task Mins"),
        t("Avg Transit Mins"),
        t("Efficiency (%)"),
      ],
      ...analyticsData.roleProductivity.map((r) => [
        r.role,
        String(r.activeStaffCount),
        String(r.tasksCompleted),
        String(r.totalDistanceKm),
        String(r.avgTaskDurationMinutes),
        String(r.avgTransitDurationMinutes),
        String(r.efficiencyRating),
      ]),
      [],
      [t("VEHICLE UTILIZATION SUMMARY")],
      [
        t("Plate Number"),
        t("Model / Type"),
        t("Vehicle Type"),
        t("Total Trips"),
        t("Distance (km)"),
        t("Active Hours"),
        t("Utilization (%)"),
        t("Status"),
      ],
      ...analyticsData.vehicleUtilization.map((v) => [
        v.registrationNumber,
        v.brandModel,
        v.vehicleType,
        String(v.totalTrips),
        String(v.totalDistanceKm),
        String(v.activeHours),
        String(v.utilizationPct),
        v.status,
      ]),
      [],
      [t("STATUTORY ETHICAL NOTICE")],
      [analyticsData.ethicalDecisionNotice],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.map(val => `"${val}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Fleet_Analytics_${analyticsData.startDate}_to_${analyticsData.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    enqueueSnackbar(t("Fleet analytics report exported as CSV"), { variant: "success" });
  };

  // Load Live Fleet
  const fetchLiveFleet = async () => {
    setLoadingLive(true);
    try {
      const data = await fleetApi.getLiveFleet();
      setLiveFleet(data);
    } catch {
      enqueueSnackbar(t("Failed to refresh live fleet telemetry"), { variant: "error" });
    } finally {
      setLoadingLive(false);
    }
  };

  // Load Vehicles & Maintenance Alerts
  const fetchVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const [vehiclesData, alertsData] = await Promise.all([
        fleetApi.getVehicles(),
        fleetApi.getMaintenanceAlerts(),
      ]);
      setVehicles(vehiclesData);
      setMaintenanceAlerts(alertsData);
    } catch {
      enqueueSnackbar(t("Failed to load vehicle registry and maintenance alerts"), { variant: "error" });
    } finally {
      setLoadingVehicles(false);
    }
  };

  // Load Break Schedules & Audit Logs
  const fetchBreakAndAudit = async () => {
    try {
      const [breaks, logs] = await Promise.all([
        fleetApi.getBreakSchedules(),
        fleetApi.getLocationAuditLogs(),
      ]);
      setBreakSchedules(breaks);
      setAuditLogs(logs);
    } catch {
      enqueueSnackbar(t("Failed to load break schedules or audit trail"), { variant: "error" });
    }
  };

  // Load Historical Route
  const fetchHistoricalRoute = async (sessionId?: string) => {
    setLoadingHistory(true);
    setIsPlaying(false);
    setPlaybackIndex(0);
    try {
      const data = await fleetApi.getHistoricalRoute(sessionId);
      setHistoryData(data);
    } catch {
      enqueueSnackbar(t("Failed to load historical route playback"), { variant: "error" });
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchLiveFleet();
  }, []);

  useEffect(() => {
    if (currentTab === 1 && !historyData && !loadingHistory) {
      fetchHistoricalRoute();
    } else if (currentTab === 2) {
      fetchVehicles();
    } else if (currentTab === 3) {
      fetchBreakAndAudit();
    } else if (currentTab === 4) {
      fetchAnalytics();
    }
  }, [currentTab]);

  // Route Playback Timer
  useEffect(() => {
    if (!isPlaying || !historyData || historyData.routePoints.length === 0) return;

    const interval = setInterval(() => {
      setPlaybackIndex((prev) => {
        if (prev >= historyData.routePoints.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, historyData, playbackSpeed]);

  // Handle switching to historical route from Live Map
  const handleInspectRoute = (sessionId: string) => {
    setCurrentTab(1);
    fetchHistoricalRoute(sessionId);
  };

  // Create Break Schedule handler
  const handleCreateBreakSchedule = async () => {
    if (!newBreakName || !newBreakStart || !newBreakEnd) {
      enqueueSnackbar(t("Please enter break name, start, and end time"), { variant: "warning" });
      return;
    }
    try {
      await fleetApi.createBreakSchedule({
        name: newBreakName,
        employeeRole: newBreakRole || undefined,
        startTime: newBreakStart,
        endTime: newBreakEnd,
      });
      enqueueSnackbar(t("Break schedule registered successfully"), { variant: "success" });
      setBreakDialogOpen(false);
      setNewBreakName("");
      fetchBreakAndAudit();
    } catch {
      enqueueSnackbar(t("Failed to create break schedule"), { variant: "error" });
    }
  };

  // Vehicle Status Toggle
  const handleToggleVehicleStatus = async (vehicleId: string, currentStatus: VehicleStatus) => {
    const nextStatus: VehicleStatus =
      currentStatus === "MAINTENANCE" ? "AVAILABLE" : "MAINTENANCE";
    try {
      await fleetApi.updateVehicleStatus(vehicleId, nextStatus);
      enqueueSnackbar(t("Vehicle status updated to {vehicle}", undefined, { vehicle: localizeDisplayCode(nextStatus) }), { variant: "success" });
      fetchVehicles();
    } catch {
      enqueueSnackbar(t("Failed to update vehicle status"), { variant: "error" });
    }
  };

  const handleOpenServiceDialog = (vehicle: VehicleDto) => {
    setSelectedVehicleForService(vehicle);
    setServiceDate(new Date().toISOString().split("T")[0]);
    setServiceOdometer(vehicle.odometerKm ?? 0);
    setServiceInterval(vehicle.serviceIntervalKm ?? 10000);
    setServiceNotes("");
    setServiceDialogOpen(true);
  };

  const handleSaveServiceLog = async () => {
    if (!selectedVehicleForService) return;
    try {
      setServiceSubmitting(true);
      await fleetApi.recordVehicleService(selectedVehicleForService.id, {
        serviceDate,
        odometerKm: serviceOdometer,
        serviceIntervalKm: serviceInterval,
        notes: serviceNotes || undefined,
      });
      enqueueSnackbar(t("Maintenance logged for {vehicle}", undefined, { vehicle: selectedVehicleForService.registrationNumber }), { variant: "success" });
      setServiceDialogOpen(false);
      fetchVehicles();
    } catch {
      enqueueSnackbar(t("Failed to record vehicle service log"), { variant: "error" });
    } finally {
      setServiceSubmitting(false);
    }
  };

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return liveFleet.filter((w) => {
      const matchSearch =
        w.employeeName.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        w.taskCode.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        (w.vehicleRegistrationNumber &&
          w.vehicleRegistrationNumber.toLowerCase().includes(rosterSearch.toLowerCase()));

      const matchRole =
        roleFilter === "ALL" ||
        (roleFilter === "DRIVER" && w.employeeRole === "DRIVER") ||
        (roleFilter === "SURVEYOR" && w.employeeRole === "SURVEYOR") ||
        (roleFilter === "COLLECTOR" && w.employeeRole === "COLLECTOR") ||
        (roleFilter === "PAUSED" && w.trackingStatus === "PAUSED");

      return matchSearch && matchRole;
    });
  }, [liveFleet, rosterSearch, roleFilter]);

  // Filtered Vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchSearch =
        v.registrationNumber.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
        v.brandModel.toLowerCase().includes(vehicleSearch.toLowerCase());
      const matchStatus = vehicleStatusFilter === "ALL" || v.status === vehicleStatusFilter;

      let matchMaintenance = true;
      if (maintenanceFilter === "EXPIRING_SOON") {
        matchMaintenance =
          (v.stnkDaysRemaining != null && v.stnkDaysRemaining <= 30) ||
          (v.kirDaysRemaining != null && v.kirDaysRemaining <= 30);
      } else if (maintenanceFilter === "SERVICE_DUE") {
        matchMaintenance = !!v.isServiceDue;
      }

      return matchSearch && matchStatus && matchMaintenance;
    });
  }, [vehicles, vehicleSearch, vehicleStatusFilter, maintenanceFilter]);

  // KPI Metrics
  const activeCount = liveFleet.filter((w) => w.trackingStatus === "ACTIVE").length;
  const pausedCount = liveFleet.filter((w) => w.trackingStatus === "PAUSED").length;
  const interruptedCount = liveFleet.filter((w) => w.trackingStatus === "INTERRUPTED").length;
  const totalFleetTracked = liveFleet.length;

  return (
    <Box>
      {/* Page Title & Actions */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          mb: 2.5,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
            <LocalShippingIcon color="primary" /> {t("Logistics & Fleet Management System")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("Task-bounded real-time GPS operations for Drivers, Surveyors, and Collectors. Strict scheduled break pauses.")}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          {currentTab === 0 && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={fetchLiveFleet}
              disabled={loadingLive}
              sx={{ textTransform: "none", borderRadius: 1.5 }}
            >
              {t("Refresh Telemetry")}
            </Button>
          )}
          {currentTab === 2 && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setVehicleDialogOpen(true)}
              sx={{ textTransform: "none", borderRadius: 1.5 }}
            >
              {t("Add Vehicle")}
            </Button>
          )}
          {currentTab === 3 && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setBreakDialogOpen(true)}
              sx={{ textTransform: "none", borderRadius: 1.5 }}
            >
              {t("Configure Break Window")}
            </Button>
          )}
        </Stack>
      </Box>

      {/* KPI Header Bar */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr 1fr" },
          gap: 2,
          mb: 3,
        }}
      >
        <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: isDark ? "#0d1424" : "#ffffff" }}>
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {t("ACTIVE OPERATIONAL STAFF")}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main, my: 0.5 }}>
              {activeCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("Currently transmitting GPS coords")}
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: isDark ? "#0d1424" : "#ffffff" }}>
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {t("SCHEDULED BREAK PAUSES")}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main, my: 0.5 }}>
              {pausedCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("Zero GPS coordinates recorded")}
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: isDark ? "#0d1424" : "#ffffff" }}>
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {t("INTERRUPTIONS / ALERTS")}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.error.main, my: 0.5 }}>
              {interruptedCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("GPS signal lost or network timeout")}
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: isDark ? "#0d1424" : "#ffffff" }}>
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {t("TOTAL ASSIGNED SESSIONS")}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main, my: 0.5 }}>
              {totalFleetTracked}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("1 Session = 1 Delivery Trip / Task")}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Navigation Tabs */}
      <Paper variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, v) => setCurrentTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label={t("Live Fleet Monitor")} icon={<LocalShippingIcon fontSize="small" />} iconPosition="start" />
          <Tab label={t("Historical Route Playback")} icon={<AccessTimeIcon fontSize="small" />} iconPosition="start" />
          <Tab label={t("Vehicle Fleet Registry")} icon={<LocalShippingIcon fontSize="small" />} iconPosition="start" />
          <Tab label={t("Scheduled Breaks & Privacy Audit")} icon={<SecurityIcon fontSize="small" />} iconPosition="start" />
          <Tab label={t("Fleet Analytics & Productivity")} icon={<AssessmentIcon fontSize="small" />} iconPosition="start" />
        </Tabs>

        {/* TAB 0: LIVE FLEET MONITOR */}
        {currentTab === 0 && (
          <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 1fr) 340px" },
                gap: 2.5,
              }}
            >
              {/* Left: Interactive Map */}
              <Box sx={{ minWidth: 0 }}>
                {loadingLive ? (
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 540 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <FleetLiveMap
                    workers={filteredRoster}
                    selectedEmployeeId={selectedEmployeeId}
                    onSelectEmployee={(id) => setSelectedEmployeeId(id)}
                    onViewRouteHistory={handleInspectRoute}
                    height={540}
                  />
                )}
              </Box>

              {/* Right: Active Field Staff Roster */}
              <Box sx={{ minWidth: 0 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    height: 540,
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: isDark ? "#0d1424" : "#fafafa",
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                    {t("Active Field Staff (")}{filteredRoster.length})
                  </Typography>

                  {/* Search and Filters */}
                  <TextField
                    size="small"
                    placeholder={t("Search staff, task, or plate...")}
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    slotProps={{ input: { startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) } }}
                    sx={{ mb: 1.5 }}
                  />

                  <Stack direction="row" spacing={0.8} sx={{ mb: 1.5, overflowX: "auto", pb: 0.5 }}>
                    {["ALL", "DRIVER", "SURVEYOR", "COLLECTOR", "PAUSED"].map((role) => (
                      <Chip
                        key={role}
                        size="small"
                        label={role}
                        color={roleFilter === role ? "primary" : "default"}
                        variant={roleFilter === role ? "filled" : "outlined"}
                        onClick={() => setRoleFilter(role)}
                        sx={{ fontSize: "0.72rem", cursor: "pointer", fontWeight: 600 }}
                      />
                    ))}
                  </Stack>

                  <Divider sx={{ mb: 1.5 }} />

                  {/* Staff List */}
                  <Box sx={{ flex: 1, overflowY: "auto", pr: 0.5 }}>
                    {filteredRoster.length === 0 ? (
                      <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                        <Typography variant="body2">{t("No active workers found matching criteria.")}</Typography>
                      </Box>
                    ) : (
                      <Stack spacing={1.2}>
                        {filteredRoster.map((worker) => {
                          const isSelected = worker.employeeId === selectedEmployeeId;
                          const isPaused = worker.trackingStatus === "PAUSED";
                          const isInterrupted = worker.trackingStatus === "INTERRUPTED";

                          return (
                            <Paper
                              key={worker.employeeId}
                              variant="outlined"
                              sx={{
                                p: 1.5,
                                borderRadius: 1.8,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                borderColor: isSelected
                                  ? theme.palette.primary.main
                                  : isDark
                                  ? "rgba(255,255,255,0.1)"
                                  : "rgba(0,0,0,0.1)",
                                bgcolor: isSelected
                                  ? isDark
                                    ? "rgba(25,118,210,0.15)"
                                    : "rgba(25,118,210,0.06)"
                                  : isDark
                                  ? "#111827"
                                  : "#ffffff",
                                "&:hover": {
                                  borderColor: theme.palette.primary.light,
                                },
                              }}
                              onClick={() => setSelectedEmployeeId(worker.employeeId)}
                            >
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.8 }}>
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                    {worker.employeeName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {worker.employeeRole} • {worker.taskCode}
                                  </Typography>
                                </Box>
                                <Chip
                                  size="small"
                                  label={localizeDisplayCode(worker.trackingStatus)}
                                  color={
                                    isPaused
                                      ? "warning"
                                      : isInterrupted
                                      ? "error"
                                      : "success"
                                  }
                                  sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700 }}
                                />
                              </Box>

                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  fontSize: "0.75rem",
                                  color: "text.secondary",
                                }}
                              >
                                <span>
                                  {worker.vehicleRegistrationNumber
                                    ? `🚗 ${worker.vehicleRegistrationNumber}`
                                    : t("📍 Mobile GPS")}
                                </span>
                                <span>
                                  {isPaused ? t("⏸️ Break Paused") : `⚡ ${worker.speedKmh ?? 0} km/h`}
                                </span>
                              </Box>
                            </Paper>
                          );
                        })}
                      </Stack>
                    )}
                  </Box>
                </Paper>
              </Box>
            </Box>
          </Box>
        )}

        {/* TAB 1: HISTORICAL ROUTE PLAYBACK */}
        {currentTab === 1 && (
          <Box sx={{ p: 2.5 }}>
            <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
              <strong>{t("UU PDP No. 27/2022 Compliance Notice:")}</strong> {t("Historical route telemetry contains sensitive personal location data. Every historical query and playback scrub event is automatically recorded in the statutory location access audit log.")}
            </Alert>

            {loadingHistory ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
                <CircularProgress />
              </Box>
            ) : !historyData ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 6 }}>
                {t("No historical route selected. Select a session to inspect breadcrumbs and timeline.")}
              </Typography>
            ) : (
              <Stack spacing={2.5}>
                {/* Route Header Info */}
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1.5fr 1fr 1fr 1fr 1.2fr" },
                      gap: 2,
                      alignItems: "center",
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {t("EMPLOYEE & ROLE")}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {historyData.employeeName} ({historyData.employeeRole})
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("Task:")} {historyData.taskCode} {historyData.vehicleRegistrationNumber && `• ${historyData.vehicleRegistrationNumber}`}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {t("TOTAL DISTANCE")}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                        {historyData.totalDistanceKm} {t("km")}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {t("ACTIVE DURATION")}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                        {historyData.activeDurationMinutes} {t("mins")}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {t("BREAK PAUSES")}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                        {historyData.pausedDurationMinutes} {t("mins")}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {t("RECORDED POINTS")}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {historyData.routePoints.length} {t("GPS Waypoints")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("Started:")} {formatDate(new Date(historyData.startTime), undefined, { timeStyle: "short" })}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                {/* SVG Visualizer and Event Feed */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 1fr) 340px" },
                    gap: 2.5,
                  }}
                >
                  {/* SVG Route Track Visualizer */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      position: "relative",
                      overflow: "hidden",
                      bgcolor: isDark ? "#090d16" : "#f4f6fa",
                    }}
                  >
                    <LocationMap
                      key={historyData.sessionId}
                      label={t("Recorded GPS route")}
                      height={320}
                      showRoute
                      points={historyData.routePoints.map((point, index) => ({
                        ...point, id: String(index), label: `${t("Waypoint")} ${formatNumber(index + 1)}`,
                      }))}
                      selectedId={String(playbackIndex)}
                      onSelect={(id) => setPlaybackIndex(Number(id))}
                    />

                    {/* Scrubber Controls */}
                    <Box
                      sx={{
                        mt: 2,
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: isDark ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.95)",
                        backdropFilter: "blur(6px)",
                        border: 1,
                        borderColor: "divider",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <IconButton
                          color="primary"
                          onClick={() => setIsPlaying((p) => !p)}
                          sx={{
                            bgcolor: theme.palette.primary.main,
                            color: "#fff",
                            "&:hover": { bgcolor: theme.palette.primary.dark },
                          }}
                        >
                          {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                        </IconButton>
                        <Box sx={{ flex: 1 }}>
                          <Slider
                            value={playbackIndex}
                            min={0}
                            max={Math.max(historyData.routePoints.length - 1, 0)}
                            onChange={(_, val) => setPlaybackIndex(val as number)}
                            valueLabelDisplay="auto"
                            valueLabelFormat={(val) => `Point #${val + 1}`}
                          />
                        </Box>
                        <Stack direction="row" spacing={0.8} sx={{ alignItems: "center" }}>
                          {[1, 2, 5, 10].map((spd) => (
                            <Chip
                              key={spd}
                              size="small"
                              label={`${formatNumber(spd)}x`}
                              color={playbackSpeed === spd ? "primary" : "default"}
                              onClick={() => setPlaybackSpeed(spd)}
                              sx={{ cursor: "pointer", fontWeight: 600 }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    </Box>
                  </Paper>

                  {/* Right: Chronological Session Event Feed */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      height: 440,
                      borderRadius: 2,
                      display: "flex",
                      flexDirection: "column",
                      bgcolor: isDark ? "#0d1424" : "#fafafa",
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                      {t("Session Event Timeline (")}{historyData.events.length})
                    </Typography>
                    <Box sx={{ flex: 1, overflowY: "auto" }}>
                      <Stack spacing={1.2}>
                        {historyData.events.map((evt) => {
                          const isBreak = evt.eventType.includes("BREAK");
                          const isStart = evt.eventType.includes("START");
                          const isEnd = evt.eventType.includes("COMPLETED");

                          return (
                            <Paper
                              key={evt.id}
                              variant="outlined"
                              sx={{
                                p: 1.2,
                                borderRadius: 1.5,
                                bgcolor: isDark ? "#111827" : "#ffffff",
                              }}
                            >
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Chip
                                  size="small"
                                  label={evt.eventType}
                                  color={
                                    isBreak ? "warning" : isStart ? "success" : isEnd ? "primary" : "default"
                                  }
                                  sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700 }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(new Date(evt.eventTimestamp), undefined, { timeStyle: "short" })}
                                </Typography>
                              </Box>
                              {evt.notes && (
                                <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "text.secondary" }}>
                                  {evt.notes}
                                </Typography>
                              )}
                            </Paper>
                          );
                        })}
                      </Stack>
                    </Box>
                  </Paper>
                </Box>
              </Stack>
            )}
          </Box>
        )}

        {/* TAB 2: VEHICLE FLEET REGISTRY */}
        {currentTab === 2 && (
          <Box sx={{ p: 2.5 }}>
            {/* Maintenance & Expiry Alerts Warning Banner */}
            {maintenanceAlerts.length > 0 && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 2.5,
                  borderRadius: 2,
                  bgcolor: isDark ? "rgba(237, 108, 2, 0.08)" : "#fff8e1",
                  borderColor: "warning.main",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                    <WarningAmberIcon color="warning" sx={{ fontSize: 32 }} />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "warning.dark" }}>
                        {t("Fleet Maintenance & Document Expiration Warnings (")}{maintenanceAlerts.length})
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t("Vehicles requiring scheduled servicing, Samsat STNK tax renewals, or Dishub KIR roadworthiness inspections.")}
                      </Typography>
                    </Box>
                  </Box>

                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                    <Chip
                      label={t("All Fleet ({count})", undefined, {
                        count: formatNumber(vehicles.length),
                      })}
                      color={maintenanceFilter === "ALL" ? "primary" : "default"}
                      onClick={() => setMaintenanceFilter("ALL")}
                      sx={{ cursor: "pointer", fontWeight: 600 }}
                    />
                    <Chip
                      label={t("Expiring Soon (<30d)")}
                      color={maintenanceFilter === "EXPIRING_SOON" ? "warning" : "default"}
                      onClick={() => setMaintenanceFilter("EXPIRING_SOON")}
                      sx={{ cursor: "pointer", fontWeight: 600 }}
                    />
                    <Chip
                      label={t("Service Due")}
                      color={maintenanceFilter === "SERVICE_DUE" ? "error" : "default"}
                      onClick={() => setMaintenanceFilter("SERVICE_DUE")}
                      sx={{ cursor: "pointer", fontWeight: 600 }}
                    />
                  </Stack>
                </Box>

                <Stack spacing={1} sx={{ mt: 1.5 }}>
                  {maintenanceAlerts.slice(0, 3).map((alert, idx) => (
                    <Alert
                      key={idx}
                      severity={
                        alert.severity === "CRITICAL" || alert.severity === "EXPIRED"
                          ? "error"
                          : "warning"
                      }
                      sx={{ py: 0.5, borderRadius: 1.5, fontSize: "0.85rem" }}
                    >
                      <strong>{alert.registrationNumber} ({alert.brandModel}):</strong> {alert.message}
                    </Alert>
                  ))}
                  {maintenanceAlerts.length > 3 && (
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: "right", display: "block" }}>
                      + {maintenanceAlerts.length - 3} {t("more alerts detected across fleet.")}
                    </Typography>
                  )}
                </Stack>
              </Paper>
            )}

            <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
              <TextField
                size="small"
                placeholder={t("Search plate or vehicle model...")}
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
                slotProps={{ input: { startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) } }}
                sx={{ minWidth: 260 }}
              />
              <TextField
                select
                size="small"
                value={vehicleStatusFilter}
                onChange={(e) => setVehicleStatusFilter(e.target.value)}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="ALL">{t("All Statuses")}</MenuItem>
                <MenuItem value="AVAILABLE">{t("Available")}</MenuItem>
                <MenuItem value="IN_USE">{t("In Use")}</MenuItem>
                <MenuItem value="MAINTENANCE">{t("Maintenance")}</MenuItem>
                <MenuItem value="DECOMMISSIONED">{t("Decommissioned")}</MenuItem>
              </TextField>

              {maintenanceAlerts.length === 0 && (
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Chip
                    size="small"
                    label={t("All")}
                    color={maintenanceFilter === "ALL" ? "primary" : "default"}
                    onClick={() => setMaintenanceFilter("ALL")}
                    sx={{ cursor: "pointer" }}
                  />
                  <Chip
                    size="small"
                    label={t("Expiring Soon (<30d)")}
                    color={maintenanceFilter === "EXPIRING_SOON" ? "warning" : "default"}
                    onClick={() => setMaintenanceFilter("EXPIRING_SOON")}
                    sx={{ cursor: "pointer" }}
                  />
                  <Chip
                    size="small"
                    label={t("Service Due")}
                    color={maintenanceFilter === "SERVICE_DUE" ? "error" : "default"}
                    onClick={() => setMaintenanceFilter("SERVICE_DUE")}
                    sx={{ cursor: "pointer" }}
                  />
                </Stack>
              )}
            </Box>

            {loadingVehicles ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                      <TableCell sx={{ fontWeight: 700 }}>{t("Registration Plate")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t("Type")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t("Brand & Model")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t("Payload & Cargo")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t("Odometer & Service")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t("STNK Expiry")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t("KIR Expiry")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t("Status")}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{t("Actions")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredVehicles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 4, color: "text.secondary" }}>
                          {t("No vehicles found matching current filters. Click &quot;Add Vehicle&quot; to register fleet units.")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredVehicles.map((v) => {
                        const stnkDays = v.stnkDaysRemaining;
                        const kirDays = v.kirDaysRemaining;

                        return (
                          <TableRow key={v.id} hover>
                            <TableCell sx={{ fontWeight: 700 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <LocalShippingIcon fontSize="small" color="primary" />
                                {v.registrationNumber}
                              </Box>
                            </TableCell>
                            <TableCell>{v.vehicleType.replace(/_/g, " ")}</TableCell>
                            <TableCell>{v.brandModel}</TableCell>
                            <TableCell>
                              {v.maxPayloadKg ? `${v.maxPayloadKg} kg` : "-"} / {v.maxVolumeCbm ? `${v.maxVolumeCbm} m³` : "-"}
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {v.odometerKm ? `${formatNumber(v.odometerKm)} km` : "-"}
                                </Typography>
                                {v.isServiceDue ? (
                                  <Chip
                                    size="small"
                                    icon={<BuildCircleIcon sx={{ fontSize: "0.85rem !important" }} />}
                                    label={t("Service Due")}
                                    color="error"
                                    sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700, mt: 0.3 }}
                                  />
                                ) : v.lastServiceOdometerKm ? (
                                  <Typography variant="caption" color="text.secondary">
                                    {t("Last:")} {formatNumber(v.lastServiceOdometerKm)} {t("km")}
                                  </Typography>
                                ) : null}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2">{v.stnkExpiryDate ?? "-"}</Typography>
                                {stnkDays != null && (
                                  <Chip
                                    size="small"
                                    label={
                                      stnkDays < 0
                                        ? t("Expired ({days} days ago)", undefined, {
                                            days: formatNumber(Math.abs(stnkDays)),
                                          })
                                        : stnkDays <= 7
                                          ? t("Critical ({days} days)", undefined, {
                                              days: formatNumber(stnkDays),
                                            })
                                          : stnkDays <= 30
                                            ? t("Expiring ({days} days)", undefined, {
                                                days: formatNumber(stnkDays),
                                              })
                                            : t("{days} days left", undefined, {
                                                days: formatNumber(stnkDays),
                                              })
                                    }
                                    color={
                                      stnkDays < 0 || stnkDays <= 7
                                        ? "error"
                                        : stnkDays <= 30
                                        ? "warning"
                                        : "success"
                                    }
                                    variant={stnkDays > 30 ? "outlined" : "filled"}
                                    sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700, mt: 0.3 }}
                                  />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2">{v.kirExpiryDate ?? "-"}</Typography>
                                {kirDays != null && (
                                  <Chip
                                    size="small"
                                    label={
                                      kirDays < 0
                                        ? t("Expired ({days} days ago)", undefined, {
                                            days: formatNumber(Math.abs(kirDays)),
                                          })
                                        : kirDays <= 7
                                          ? t("Critical ({days} days)", undefined, {
                                              days: formatNumber(kirDays),
                                            })
                                          : kirDays <= 30
                                            ? t("Expiring ({days} days)", undefined, {
                                                days: formatNumber(kirDays),
                                              })
                                            : t("{days} days left", undefined, {
                                                days: formatNumber(kirDays),
                                              })
                                    }
                                    color={
                                      kirDays < 0 || kirDays <= 7
                                        ? "error"
                                        : kirDays <= 30
                                        ? "warning"
                                        : "success"
                                    }
                                    variant={kirDays > 30 ? "outlined" : "filled"}
                                    sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700, mt: 0.3 }}
                                  />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={localizeDisplayCode(v.status)}
                                color={
                                  v.status === "AVAILABLE"
                                    ? "success"
                                    : v.status === "IN_USE"
                                    ? "primary"
                                    : v.status === "MAINTENANCE"
                                    ? "warning"
                                    : "default"
                                }
                                sx={{ fontWeight: 700, fontSize: "0.72rem" }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={0.8} sx={{ justifyContent: "flex-end" }}>
                                <Tooltip title={t("Log Periodic Maintenance")}>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="info"
                                    startIcon={<BuildCircleIcon />}
                                    onClick={() => handleOpenServiceDialog(v)}
                                    sx={{ textTransform: "none", fontSize: "0.72rem", py: 0.2, px: 0.8 }}
                                  >
                                    {t("Service")}
                                  </Button>
                                </Tooltip>
                                <Tooltip
                                  title={
                                    v.status === "MAINTENANCE"
                                      ? t("Mark Available")
                                      : t("Send to Maintenance")
                                  }
                                >
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color={v.status === "MAINTENANCE" ? "success" : "warning"}
                                    onClick={() => handleToggleVehicleStatus(v.id, v.status)}
                                    sx={{ textTransform: "none", fontSize: "0.72rem", py: 0.2, px: 0.8 }}
                                  >
                                    {v.status === "MAINTENANCE"
                                      ? t("Ready")
                                      : t("Maintenance")}
                                  </Button>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* TAB 3: SCHEDULED BREAKS & PRIVACY AUDIT TRAIL */}
        {currentTab === 3 && (
          <Box sx={{ p: 2.5 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "1fr 1.3fr" },
                gap: 3,
              }}
            >
              {/* Left: Scheduled Breaks Policy */}
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                  <AccessTimeIcon color="primary" /> {t("Strict Scheduled Breaks Policy")}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t("GPS tracking automatically pauses during active break windows. Coordinate transmission is completely rejected by the backend server, and deferrals are prohibited.")}
                </Typography>

                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5, mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>{t("Break Window")}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t("Schedule")}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t("Role Target")}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t("Status")}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {breakSchedules.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 3, color: "text.secondary" }}>
                            {t("No break windows configured.")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        breakSchedules.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell sx={{ fontWeight: 600 }}>{b.name}</TableCell>
                            <TableCell>{b.startTime} - {b.endTime}</TableCell>
                            <TableCell>{b.employeeRole ?? "ALL ROLES"}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={b.active ? t("Enforced") : t("Inactive")}
                                color={b.active ? "success" : "default"}
                                sx={{ fontSize: "0.7rem", height: 20 }}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Right: Sensitive Location Access Audit Log */}
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                  <SecurityIcon color="primary" /> {t("Statutory Location Access Audit Log")}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t("Indonesian UU PDP No. 27/2022 compliant. Records every management operator who accesses real-time or historical coordinates.")}
                </Typography>

                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5, maxHeight: 380 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>{t("Timestamp")}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t("Operator")}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t("Query Type")}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t("Target Employee")}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t("IP Address")}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {auditLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3, color: "text.secondary" }}>
                            {t("No audit log entries recorded yet.")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        auditLogs.map((log) => (
                          <TableRow key={log.id} hover>
                            <TableCell sx={{ fontSize: "0.75rem" }}>
                              {formatDate(new Date(log.timestamp), undefined, { dateStyle: "medium", timeStyle: "short" })}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{log.actorEmployeeName}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={log.queryType.replace(/_/g, " ")}
                                variant="outlined"
                                color="info"
                                sx={{ fontSize: "0.68rem", height: 20 }}
                              />
                            </TableCell>
                            <TableCell>{log.targetEmployeeName ?? "-"}</TableCell>
                            <TableCell sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                              {log.ipAddress ?? "127.0.0.1"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
          </Box>
        )}

        {/* TAB 4: FLEET ANALYTICS & PRODUCTIVITY REPORTING */}
        {currentTab === 4 && (
          <Box sx={{ p: 2.5 }}>
            {/* Top Filter and Action Bar */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                mb: 3,
                borderRadius: 2,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                bgcolor: isDark ? "#0d1424" : "#f8fafc",
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap" }} useFlexGap>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>
                  {t("Date Period:")}
                </Typography>
                <TextField
                  type="date"
                  size="small"
                  label={t("Start Date")}
                  value={analyticsStartDate}
                  onChange={(e) => setAnalyticsStartDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ width: 155 }}
                />
                <TextField
                  type="date"
                  size="small"
                  label={t("End Date")}
                  value={analyticsEndDate}
                  onChange={(e) => setAnalyticsEndDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ width: 155 }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    const today = new Date().toISOString().split("T")[0];
                    setAnalyticsStartDate(today);
                    setAnalyticsEndDate(today);
                    fetchAnalytics(today, today);
                  }}
                  sx={{ textTransform: "none", borderRadius: 1.5 }}
                >
                  {t("Today")}</Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    const end = new Date().toISOString().split("T")[0];
                    const start = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
                    setAnalyticsStartDate(start);
                    setAnalyticsEndDate(end);
                    fetchAnalytics(start, end);
                  }}
                  sx={{ textTransform: "none", borderRadius: 1.5 }}
                >
                  {t("Last 7 Days")}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    const now = new Date();
                    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
                    const end = now.toISOString().split("T")[0];
                    setAnalyticsStartDate(start);
                    setAnalyticsEndDate(end);
                    fetchAnalytics(start, end);
                  }}
                  sx={{ textTransform: "none", borderRadius: 1.5 }}
                >
                  {t("Month-to-Date")}
                </Button>
              </Stack>

              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={() => fetchAnalytics(analyticsStartDate, analyticsEndDate)}
                  disabled={loadingAnalytics}
                  sx={{ textTransform: "none", borderRadius: 1.5 }}
                >
                  {t("Refresh Analytics")}
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportCsv}
                  disabled={!analyticsData || loadingAnalytics}
                  sx={{ textTransform: "none", borderRadius: 1.5 }}
                >
                  {t("Export CSV Report")}
                </Button>
              </Stack>
            </Paper>

            {/* Ethical Decision Support Standard Banner */}
            <Alert
              severity="warning"
              icon={<SecurityIcon sx={{ fontSize: 26 }} />}
              sx={{
                mb: 3,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "warning.main",
                "& .MuiAlert-message": { width: "100%" },
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, letterSpacing: 0.5 }}>
                {t("STATUTORY ETHICAL DECISION SUPPORT STANDARD (MANDATORY OPERATIONAL NOTICE)")}
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                {analyticsData?.ethicalDecisionNotice ||
                  "GPS-derived telemetry reflects machine observations only and must NEVER be used as the sole or definitive basis for punitive employee action, wage deductions, or disciplinary sanctions without evaluating operational factors (severe Jakarta weather, traffic gridlock, multi-flight heavy furniture stair climbs, cellular blind spots, customer delays)."}
              </Typography>
            </Alert>

            {loadingAnalytics ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 350 }}>
                <CircularProgress />
              </Box>
            ) : analyticsData ? (
              <Stack spacing={3}>
                {/* Analytics Metric Cards */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr 1fr" },
                    gap: 2,
                  }}
                >
                  <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: isDark ? "#0d1424" : "#ffffff" }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {t("TOTAL FLEET DISTANCE")}
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: "primary.main", my: 0.5 }}>
                        {analyticsData.totalDistanceKm} {t("km")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("Active:")} {analyticsData.totalActiveHours} {t("hrs • Paused:")} {analyticsData.totalPausedHours} {t("hrs")}
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: isDark ? "#0d1424" : "#ffffff" }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {t("FIELD TASK COMPLETIONS")}
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: "success.main", my: 0.5 }}>
                        {analyticsData.completedDeliveriesCount + analyticsData.completedSurveysCount + analyticsData.completedCollectionsCount}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {analyticsData.completedDeliveriesCount} {t("Drops (")}{analyticsData.completedTripsCount} {t("Trips) •")} {analyticsData.completedSurveysCount} {t("Surveys •")} {analyticsData.completedCollectionsCount} {t("Visits")}
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: isDark ? "#0d1424" : "#ffffff" }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {t("AVG VISIT & TRANSIT DURATION")}
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: "warning.main", my: 0.5 }}>
                        {analyticsData.avgVisitDurationMinutes} {t("m /")} {analyticsData.avgTransitDurationMinutes} {t("m")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("On-Site Visit Avg:")} {analyticsData.avgVisitDurationMinutes}{t("m • Transit Avg:")} {analyticsData.avgTransitDurationMinutes}{t("m")}
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: isDark ? "#0d1424" : "#ffffff" }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {t("VEHICLE FLEET UTILIZATION")}
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: "info.main", my: 0.5 }}>
                        {analyticsData.overallVehicleUtilizationPct}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("Across registered operational blind vans & trucks")}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                {/* Role Productivity Breakdown */}
                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                  <Box sx={{ p: 2, bgcolor: isDark ? "#131c31" : "#f1f5f9" }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {t("👥 Operational Role Productivity Breakdown")}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("GPS-correlated task completions and duration metrics by employee category")}
                    </Typography>
                  </Box>
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: isDark ? "#0d1424" : "#f8fafc" }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>{t("Operational Role")}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{t("Active Field Staff")}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{t("Completed Tasks / Drops")}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{t("Total Distance (km)")}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{t("Avg Task Duration")}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{t("Avg Transit Duration")}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{t("Operational Efficiency")}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analyticsData.roleProductivity.map((r) => (
                          <TableRow key={r.role} hover>
                            <TableCell sx={{ fontWeight: 600 }}>
                              <Chip
                                label={r.role}
                                size="small"
                                color={r.role === "DRIVER" ? "primary" : r.role === "SURVEYOR" ? "success" : "warning"}
                                sx={{ fontWeight: 700, fontSize: "0.72rem" }}
                              />
                            </TableCell>
                            <TableCell>{r.activeStaffCount} {t("staff")}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{r.tasksCompleted} {t("units")}</TableCell>
                            <TableCell>{r.totalDistanceKm} {t("km")}</TableCell>
                            <TableCell>{r.avgTaskDurationMinutes} {t("mins")}</TableCell>
                            <TableCell>{r.avgTransitDurationMinutes} {t("mins")}</TableCell>
                            <TableCell>
                              <Chip
                                label={`${formatNumber(r.efficiencyRating)}%`}
                                size="small"
                                variant="outlined"
                                color="success"
                                sx={{ fontWeight: 700 }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>

                {/* Vehicle Utilization Table */}
                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                  <Box sx={{ p: 2, bgcolor: isDark ? "#131c31" : "#f1f5f9" }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {t("🚗 Vehicle Utilization & Mileage Telematics")}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("Individual vehicle dispatch frequency, active runtime, and overall capacity utilization")}
                    </Typography>
                  </Box>
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: isDark ? "#0d1424" : "#f8fafc" }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>{t("Registration Number")}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{t("Brand & Model")}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{t("Type")}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{t("Total Trips")}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{t("Distance Traveled")}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{t("Active Hours")}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{t("Utilization Rate")}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{t("Status")}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analyticsData.vehicleUtilization.map((v) => (
                          <TableRow key={v.registrationNumber} hover>
                            <TableCell sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                              {v.registrationNumber}
                            </TableCell>
                            <TableCell>{v.brandModel}</TableCell>
                            <TableCell>
                              <Chip label={v.vehicleType} size="small" variant="outlined" sx={{ fontSize: "0.7rem" }} />
                            </TableCell>
                            <TableCell>{v.totalTrips} {t("trips")}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{v.totalDistanceKm} {t("km")}</TableCell>
                            <TableCell>{v.activeHours} {t("hrs")}</TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {v.utilizationPct}%
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={localizeDisplayCode(v.status)}
                                size="small"
                                color={v.status === "AVAILABLE" ? "success" : v.status === "IN_USE" ? "primary" : "default"}
                                sx={{ fontSize: "0.7rem", fontWeight: 700 }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>

                {/* Telematics Interruptions & Operational Exception Summary */}
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                    {t("⚡ Telematics Interruptions & Operational Events Audit")}
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }} useFlexGap>
                    <Chip
                      icon={<AccessTimeIcon />}
                      label={t("Scheduled Break Pauses: {count}", undefined, {
                        count: formatNumber(analyticsData.interruptionCounts?.SCHEDULED_BREAK ?? 0),
                      })}
                      color="info"
                      variant="outlined"
                      sx={{ p: 1, py: 2, fontWeight: 600 }}
                    />
                    <Chip
                      icon={<PauseIcon />}
                      label={t("Exceptional Manual Pauses: {count}", undefined, {
                        count: formatNumber(analyticsData.interruptionCounts?.MANUAL_PAUSE ?? 0),
                      })}
                      color="warning"
                      variant="outlined"
                      sx={{ p: 1, py: 2, fontWeight: 600 }}
                    />
                    <Chip
                      icon={<SecurityIcon />}
                      label={t("Adaptive Low-Battery Throttles (60s): {count}", undefined, {
                        count: formatNumber(analyticsData.interruptionCounts?.LOW_BATTERY_THROTTLE ?? 0),
                      })}
                      color="secondary"
                      variant="outlined"
                      sx={{ p: 1, py: 2, fontWeight: 600 }}
                    />
                    <Chip
                      icon={<RefreshIcon />}
                      label={t("Signal Loss / Reconnection Events: {count}", undefined, {
                        count: formatNumber(analyticsData.interruptionCounts?.SIGNAL_LOSS ?? 0),
                      })}
                      color="default"
                      variant="outlined"
                      sx={{ p: 1, py: 2, fontWeight: 600 }}
                    />
                  </Stack>
                </Paper>
              </Stack>
            ) : null}
          </Box>
        )}

      </Paper>

      {/* Vehicle Form Dialog */}
      <VehicleFormDialog
        open={vehicleDialogOpen}
        onClose={() => setVehicleDialogOpen(false)}
        onCreated={() => {
          setVehicleDialogOpen(false);
          fetchVehicles();
        }}
      />

      {/* Service Record Dialog */}
      <Dialog
        open={serviceDialogOpen}
        onClose={() => setServiceDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t("Record Vehicle Service —")} {selectedVehicleForService?.registrationNumber}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t("Log periodic routine maintenance (oil change, filters, brake pads) to reset preventative service mileage countdown.")}
            </Typography>
            <TextField
              label={t("Service Date")}
              type="date"
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
              required
            />
            <TextField
              label={t("Odometer at Service (km)")}
              type="number"
              size="small"
              fullWidth
              value={serviceOdometer}
              onChange={(e) => setServiceOdometer(Number(e.target.value))}
              required
            />
            <TextField
              label={t("Next Service Interval (km)")}
              type="number"
              size="small"
              fullWidth
              value={serviceInterval}
              onChange={(e) => setServiceInterval(Number(e.target.value))}
              helperText={t("Default 10,000 km between preventative maintenance")}
            />
            <TextField
              label={t("Service Notes / Workshop Details")}
              size="small"
              multiline
              rows={2}
              placeholder={t("e.g. Authorized Bengkel Resmi Daihatsu - 10,000km package")}
              value={serviceNotes}
              onChange={(e) => setServiceNotes(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setServiceDialogOpen(false)} sx={{ textTransform: "none" }} disabled={serviceSubmitting}>
            {t("Cancel")}</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveServiceLog}
            disabled={serviceSubmitting || !serviceDate || serviceOdometer <= 0}
            sx={{ textTransform: "none", borderRadius: 1.5 }}
          >
            {serviceSubmitting ? t("Recording...") : t("Save Service Record")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Break Schedule Dialog */}
      <Dialog open={breakDialogOpen} onClose={() => setBreakDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{t("Configure Scheduled Break")}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t("Break Name")}
              size="small"
              placeholder={t("e.g. Istirahat Siang")}
              value={newBreakName}
              onChange={(e) => setNewBreakName(e.target.value)}
              fullWidth
              required
            />
            <TextField
              select
              label={t("Employee Role (Optional)")}
              size="small"
              value={newBreakRole}
              onChange={(e) => setNewBreakRole(e.target.value)}
              fullWidth
            >
              <MenuItem value="">{t("All Field Roles")}</MenuItem>
              <MenuItem value="DRIVER">{t("Driver Only")}</MenuItem>
              <MenuItem value="SURVEYOR">{t("Surveyor Only")}</MenuItem>
              <MenuItem value="COLLECTOR">{t("Collector Only")}</MenuItem>
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField
                label={t("Start Time")}
                type="time"
                size="small"
                value={newBreakStart}
                onChange={(e) => setNewBreakStart(e.target.value)}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label={t("End Time")}
                type="time"
                size="small"
                value={newBreakEnd}
                onChange={(e) => setNewBreakEnd(e.target.value)}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setBreakDialogOpen(false)} sx={{ textTransform: "none" }}>
            {t("Cancel")}</Button>
          <Button
            variant="contained"
            onClick={handleCreateBreakSchedule}
            sx={{ textTransform: "none", borderRadius: 1.5 }}
          >
            {t("Save Break Schedule")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
