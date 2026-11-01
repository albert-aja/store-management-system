import React, { useState, useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import BuildIcon from "@mui/icons-material/Build";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import { useSnackbar } from "notistack";
import {
  useMaintenanceSchedules,
  useCreateMaintenanceSchedule,
  useUpdateMaintenanceScheduleStatus,
  useFuelLogs,
  useRecordFuelLog,
  useIncidentReports,
  useReportIncident,
  useUpdateIncidentStatus,
} from "./hooks";
import type {
  CreateMaintenanceScheduleRequest,
  CreateFuelLogRequest,
  CreateIncidentReportRequest,
  VehicleDto,
  VehicleIncidentReportDto,
  VehicleMaintenanceScheduleDto,
} from "../fleet/fleetApi";
import { formatDate, formatCurrency, useLanguage } from "../../lib/locale";

interface TabContentProps {
  truck: VehicleDto;
}

// ══════════════════════════════════════════════════════════════════════════
// TAB 3: MAINTENANCE SCHEDULER
// ══════════════════════════════════════════════════════════════════════════

export function MaintenanceScheduleTabContent({ truck }: TabContentProps) {
  const language = useLanguage();
  const { enqueueSnackbar } = useSnackbar();
  const { data: schedules = [], isLoading } = useMaintenanceSchedules(truck.id);
  const updateStatusMutation = useUpdateMaintenanceScheduleStatus();

  const [modalOpen, setModalOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<VehicleMaintenanceScheduleDto | null>(null);
  const [actualCostInput, setActualCostInput] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const dueCount = useMemo(
    () => schedules.filter((s) => s.isDueOrOverdue && s.status === "SCHEDULED").length,
    [schedules]
  );

  const totalEstimatedCost = useMemo(
    () =>
      schedules
        .filter((s) => s.status !== "CANCELLED")
        .reduce((sum, s) => sum + (Number(s.estimatedCost) || 0), 0),
    [schedules]
  );

  const handleOpenComplete = (schedule: VehicleMaintenanceScheduleDto) => {
    setSelectedSchedule(schedule);
    setActualCostInput(schedule.estimatedCost ? String(schedule.estimatedCost) : "");
    setCompletionNotes("");
    setCompleteDialogOpen(true);
  };

  const handleConfirmComplete = async () => {
    if (!selectedSchedule) return;
    setUpdating(true);
    try {
      await updateStatusMutation.mutateAsync({
        scheduleId: selectedSchedule.id,
        vehicleId: truck.id,
        data: {
          status: "COMPLETED",
          actualCost: actualCostInput ? Number(actualCostInput) : undefined,
          notes: completionNotes.trim() || undefined,
        },
      });
      enqueueSnackbar("Maintenance marked as COMPLETED", { variant: "success" });
      setCompleteDialogOpen(false);
    } catch {
      enqueueSnackbar("Failed to update maintenance schedule", { variant: "error" });
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelSchedule = async (schedule: VehicleMaintenanceScheduleDto) => {
    try {
      await updateStatusMutation.mutateAsync({
        scheduleId: schedule.id,
        vehicleId: truck.id,
        data: { status: "CANCELLED" },
      });
      enqueueSnackbar("Maintenance schedule cancelled", { variant: "info" });
    } catch {
      enqueueSnackbar("Failed to cancel schedule", { variant: "error" });
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {dueCount > 0 && (
        <Alert severity="warning" icon={<WarningAmberIcon />}>
          <strong>{dueCount} upcoming maintenance item(s)</strong> are due or overdue based on target mileage or scheduled date!
        </Alert>
      )}

      {/* KPI Cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
              Total Scheduled Bookings
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: "primary.main" }}>
              {schedules.length}
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
              Due / Overdue Tasks
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: dueCount > 0 ? "warning.main" : "success.main" }}>
              {dueCount}
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
              Total Estimated Budget
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
              {formatCurrency(totalEstimatedCost, language)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Action Bar */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Vehicle Maintenance Schedule
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setModalOpen(true)}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          Schedule Maintenance
        </Button>
      </Box>

      {/* Schedules Table */}
      {isLoading ? (
        <Typography color="text.secondary">Loading maintenance schedules...</Typography>
      ) : schedules.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
          <BuildIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
          <Typography color="text.secondary">No maintenance schedules planned for this vehicle.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: "background.default" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Scheduled Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Maintenance Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Target Mileage</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Est. Cost</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actual Cost</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Service Center</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedules.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(s.scheduledDate, language)}</TableCell>
                  <TableCell>
                    <Chip label={s.maintenanceType.replace(/_/g, " ")} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {s.targetOdometerKm ? `${s.targetOdometerKm.toLocaleString()} km` : "-"}
                  </TableCell>
                  <TableCell>{formatCurrency(s.estimatedCost, language)}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: s.actualCost ? "success.main" : "text.secondary" }}>
                    {s.actualCost ? formatCurrency(s.actualCost, language) : "-"}
                  </TableCell>
                  <TableCell>{s.serviceCenter || "-"}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        label={s.status}
                        size="small"
                        color={
                          s.status === "COMPLETED"
                            ? "success"
                            : s.status === "IN_PROGRESS"
                            ? "primary"
                            : s.status === "CANCELLED"
                            ? "default"
                            : "warning"
                        }
                      />
                      {s.isDueOrOverdue && s.status === "SCHEDULED" && (
                        <Chip label="DUE" size="small" color="error" variant="filled" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {s.status === "SCHEDULED" && (
                      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                        <Button
                          size="small"
                          color="success"
                          variant="outlined"
                          onClick={() => handleOpenComplete(s)}
                          sx={{ textTransform: "none", fontSize: "0.75rem", py: 0.2 }}
                        >
                          Complete
                        </Button>
                        <Button
                          size="small"
                          color="inherit"
                          onClick={() => handleCancelSchedule(s)}
                          sx={{ textTransform: "none", fontSize: "0.75rem", py: 0.2 }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ScheduleMaintenanceDialog open={modalOpen} truck={truck} onClose={() => setModalOpen(false)} />

      {/* Complete Maintenance Dialog */}
      <Dialog open={completeDialogOpen} onClose={() => setCompleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Complete Maintenance Booking</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Recording completion for <strong>{selectedSchedule?.maintenanceType.replace(/_/g, " ")}</strong>.
          </Typography>
          <TextField
            label="Actual Cost (Rp)"
            size="small"
            type="number"
            value={actualCostInput}
            onChange={(e) => setActualCostInput(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start">Rp</InputAdornment> } }}
          />
          <TextField
            label="Completion Notes"
            size="small"
            multiline
            rows={3}
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            placeholder="e.g. Work completed on schedule, genuine oil & filters used"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCompleteDialogOpen(false)} disabled={updating}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleConfirmComplete} disabled={updating}>
            {updating ? "Saving..." : "Mark Completed"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// TAB 4: FUEL CONSUMPTION LOGS
// ══════════════════════════════════════════════════════════════════════════

export function FuelLogTabContent({ truck }: TabContentProps) {
  const language = useLanguage();
  const { data: fuelLogs = [], isLoading } = useFuelLogs(truck.id);
  const [modalOpen, setModalOpen] = useState(false);

  const totalFuelSpend = useMemo(
    () => fuelLogs.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0),
    [fuelLogs]
  );

  const totalFuelLiters = useMemo(
    () => fuelLogs.reduce((sum, item) => sum + (Number(item.fuelLiters) || 0), 0),
    [fuelLogs]
  );

  const averageEfficiency = useMemo(() => {
    const valid = fuelLogs.filter((f) => f.efficiencyKmPerLiter != null && Number(f.efficiencyKmPerLiter) > 0);
    if (valid.length === 0) return 0;
    const sum = valid.reduce((acc, f) => acc + Number(f.efficiencyKmPerLiter), 0);
    return Number((sum / valid.length).toFixed(2));
  }, [fuelLogs]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* KPI Cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
              Total Fuel Spend
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: "primary.main" }}>
              {formatCurrency(totalFuelSpend, language)}
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
              Total Liters Filled
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
              {totalFuelLiters.toFixed(1)} L
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
              Average Fuel Economy
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: averageEfficiency > 0 ? "success.main" : "text.secondary" }}>
              {averageEfficiency > 0 ? `${averageEfficiency} km/L` : "N/A"}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Action Bar */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Fuel Consumption Log Tracking
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setModalOpen(true)}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          Record Fuel Refill
        </Button>
      </Box>

      {/* Fuel Logs Table */}
      {isLoading ? (
        <Typography color="text.secondary">Loading fuel consumption records...</Typography>
      ) : fuelLogs.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
          <LocalGasStationIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
          <Typography color="text.secondary">No fuel refills recorded yet for this vehicle.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: "background.default" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Driver</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Odometer</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Volume</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Price / L</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Total Cost</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Efficiency</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Gas Station</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Receipt #</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fuelLogs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(log.logDate, language)}</TableCell>
                  <TableCell>{log.driverName || "-"}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{log.odometerKm.toLocaleString()} km</TableCell>
                  <TableCell>{log.fuelLiters} L</TableCell>
                  <TableCell>{formatCurrency(log.costPerLiter, language)}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "primary.main" }}>
                    {formatCurrency(log.totalCost, language)}
                  </TableCell>
                  <TableCell>
                    {log.efficiencyKmPerLiter ? (
                      <Chip
                        label={`${log.efficiencyKmPerLiter} km/L`}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>{log.gasStationName || "-"}</TableCell>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                    {log.invoiceNumber || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <RecordFuelLogDialog open={modalOpen} truck={truck} onClose={() => setModalOpen(false)} />
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// TAB 5: INCIDENT DAMAGE REPORTS
// ══════════════════════════════════════════════════════════════════════════

export function IncidentReportTabContent({ truck }: TabContentProps) {
  const language = useLanguage();
  const { enqueueSnackbar } = useSnackbar();
  const { data: incidentReports = [], isLoading } = useIncidentReports(truck.id);
  const updateStatusMutation = useUpdateIncidentStatus();

  const [modalOpen, setModalOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<VehicleIncidentReportDto | null>(null);
  const [statusSelect, setStatusSelect] = useState("RESOLVED");
  const [actualCostInput, setActualCostInput] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const activeIncidents = useMemo(
    () => incidentReports.filter((i) => i.status !== "RESOLVED" && i.status !== "REJECTED").length,
    [incidentReports]
  );

  const totalRepairCost = useMemo(
    () =>
      incidentReports.reduce((sum, item) => sum + (Number(item.actualRepairCost || item.estimatedRepairCost) || 0), 0),
    [incidentReports]
  );

  const handleOpenResolve = (incident: VehicleIncidentReportDto) => {
    setSelectedIncident(incident);
    setStatusSelect("RESOLVED");
    setActualCostInput(incident.actualRepairCost ? String(incident.actualRepairCost) : String(incident.estimatedRepairCost || ""));
    setResolutionNotes("");
    setResolveDialogOpen(true);
  };

  const handleConfirmUpdate = async () => {
    if (!selectedIncident) return;
    setUpdating(true);
    try {
      await updateStatusMutation.mutateAsync({
        incidentId: selectedIncident.id,
        vehicleId: truck.id,
        data: {
          status: statusSelect,
          actualRepairCost: actualCostInput ? Number(actualCostInput) : undefined,
          resolutionNotes: resolutionNotes.trim() || undefined,
        },
      });
      enqueueSnackbar(`Incident marked as ${statusSelect}`, { variant: "success" });
      setResolveDialogOpen(false);
    } catch {
      enqueueSnackbar("Failed to update incident status", { variant: "error" });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* KPI Cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
              Total Incident Reports
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: "primary.main" }}>
              {incidentReports.length}
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
              Active / Unresolved
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: activeIncidents > 0 ? "error.main" : "success.main" }}>
              {activeIncidents}
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
              Total Repair Cost Exposure
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: "error.main" }}>
              {formatCurrency(totalRepairCost, language)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Action Bar */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Vehicle Incident & Damage Reports
        </Typography>
        <Button
          variant="contained"
          size="small"
          color="error"
          startIcon={<AddIcon />}
          onClick={() => setModalOpen(true)}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          Report Damage Incident
        </Button>
      </Box>

      {/* Incidents Table */}
      {isLoading ? (
        <Typography color="text.secondary">Loading incident reports...</Typography>
      ) : incidentReports.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
          <CheckCircleIcon sx={{ fontSize: 40, color: "success.main", mb: 1 }} />
          <Typography color="text.secondary">No damage incidents reported. Fleet vehicle is accident-free!</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: "background.default" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Severity</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Est. Cost</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actual Cost</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {incidentReports.map((inc) => (
                <TableRow key={inc.id} hover>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(inc.incidentDate, language)}</TableCell>
                  <TableCell>
                    <Chip label={inc.incidentType.replace(/_/g, " ")} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={inc.severity}
                      size="small"
                      color={
                        inc.severity === "CRITICAL" || inc.severity === "HIGH"
                          ? "error"
                          : inc.severity === "MEDIUM"
                          ? "warning"
                          : "info"
                      }
                    />
                  </TableCell>
                  <TableCell>{inc.location || "-"}</TableCell>
                  <TableCell sx={{ maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {inc.description}
                  </TableCell>
                  <TableCell>{formatCurrency(inc.estimatedRepairCost, language)}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: inc.actualRepairCost ? "error.main" : "text.secondary" }}>
                    {inc.actualRepairCost ? formatCurrency(inc.actualRepairCost, language) : "-"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={inc.status}
                      size="small"
                      color={inc.status === "RESOLVED" || inc.status === "REPAIRED" ? "success" : "default"}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {inc.status !== "RESOLVED" && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpenResolve(inc)}
                        sx={{ textTransform: "none", fontSize: "0.75rem", py: 0.2 }}
                      >
                        Update
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ReportIncidentDialog open={modalOpen} truck={truck} onClose={() => setModalOpen(false)} />

      {/* Resolve / Update Incident Dialog */}
      <Dialog open={resolveDialogOpen} onClose={() => setResolveDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Update Incident Resolution</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <FormControl size="small">
            <InputLabel>Status</InputLabel>
            <Select value={statusSelect} label="Status" onChange={(e) => setStatusSelect(e.target.value)}>
              <MenuItem value="UNDER_INSPECTION">Under Inspection</MenuItem>
              <MenuItem value="REPAIR_SCHEDULED">Repair Scheduled</MenuItem>
              <MenuItem value="REPAIRED">Repaired</MenuItem>
              <MenuItem value="RESOLVED">Resolved (Ready for Road)</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Actual Repair Cost (Rp)"
            size="small"
            type="number"
            value={actualCostInput}
            onChange={(e) => setActualCostInput(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start">Rp</InputAdornment> } }}
          />
          <TextField
            label="Resolution Notes"
            size="small"
            multiline
            rows={3}
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="e.g. Body repair and repainting completed at authorised workshop"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setResolveDialogOpen(false)} disabled={updating}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleConfirmUpdate} disabled={updating}>
            {updating ? "Saving..." : "Save Resolution"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// DIALOG: SCHEDULE MAINTENANCE
// ══════════════════════════════════════════════════════════════════════════

export function ScheduleMaintenanceDialog({
  open,
  truck,
  onClose,
}: {
  open: boolean;
  truck: VehicleDto;
  onClose: () => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const createMutation = useCreateMaintenanceSchedule();

  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split("T")[0]);
  const [maintenanceType, setMaintenanceType] = useState("ROUTINE_SERVICE");
  const [targetOdometerKm, setTargetOdometerKm] = useState(
    truck.odometerKm ? String(truck.odometerKm + 5000) : ""
  );
  const [estimatedCost, setEstimatedCost] = useState("1500000");
  const [serviceCenter, setServiceCenter] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: CreateMaintenanceScheduleRequest = {
        scheduledDate,
        maintenanceType,
        targetOdometerKm: targetOdometerKm ? Number(targetOdometerKm) : undefined,
        estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
        serviceCenter: serviceCenter.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      await createMutation.mutateAsync({ vehicleId: truck.id, data: payload });
      enqueueSnackbar("Maintenance schedule created successfully", { variant: "success" });
      onClose();
    } catch {
      enqueueSnackbar("Failed to create maintenance schedule", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Schedule Vehicle Maintenance</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="Scheduled Date"
            type="date"
            size="small"
            required
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <FormControl size="small" required>
            <InputLabel>Maintenance Type</InputLabel>
            <Select value={maintenanceType} label="Maintenance Type" onChange={(e) => setMaintenanceType(e.target.value)}>
              <MenuItem value="ROUTINE_SERVICE">Routine Periodic Service</MenuItem>
              <MenuItem value="OIL_CHANGE">Engine Oil & Filter Change</MenuItem>
              <MenuItem value="TIRE_ROTATION">Tire Rotation & Wheel Alignment</MenuItem>
              <MenuItem value="BRAKE_OVERHAUL">Brake Pad & Fluid Overhaul</MenuItem>
              <MenuItem value="PERIODIC_INSPECTION">Uji KIR / Safety Inspection</MenuItem>
              <MenuItem value="EMERGENCY_REPAIR">Emergency Mechanical Repair</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Target Odometer (km)"
            type="number"
            size="small"
            value={targetOdometerKm}
            onChange={(e) => setTargetOdometerKm(e.target.value)}
            placeholder="e.g. 25000"
          />

          <TextField
            label="Estimated Cost (Rp)"
            type="number"
            size="small"
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start">Rp</InputAdornment> } }}
          />

          <TextField
            label="Service Center / Workshop"
            size="small"
            value={serviceCenter}
            onChange={(e) => setServiceCenter(e.target.value)}
            placeholder="e.g. Bengkel Resmi Isuzu / Hino"
          />

          <TextField
            label="Notes"
            size="small"
            multiline
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special instructions or items to check"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? "Scheduling..." : "Confirm Schedule"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// DIALOG: RECORD FUEL LOG
// ══════════════════════════════════════════════════════════════════════════

export function RecordFuelLogDialog({
  open,
  truck,
  onClose,
}: {
  open: boolean;
  truck: VehicleDto;
  onClose: () => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const recordMutation = useRecordFuelLog();

  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [odometerKm, setOdometerKm] = useState(truck.odometerKm ? String(truck.odometerKm) : "");
  const [fuelLiters, setFuelLiters] = useState("50");
  const [costPerLiter, setCostPerLiter] = useState("6800");
  const [fuelType, setFuelType] = useState("SOLAR");
  const [gasStationName, setGasStationName] = useState("SPBU Pertamina");
  const [fullTank, setFullTank] = useState(true);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const calculatedTotal = useMemo(() => {
    const l = Number(fuelLiters) || 0;
    const c = Number(costPerLiter) || 0;
    return l * c;
  }, [fuelLiters, costPerLiter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!odometerKm || !fuelLiters || !costPerLiter) {
      enqueueSnackbar("Please fill required fuel fields", { variant: "warning" });
      return;
    }
    setSaving(true);
    try {
      const payload: CreateFuelLogRequest = {
        logDate,
        driverEmployeeId: truck.driverEmployeeId,
        odometerKm: Number(odometerKm),
        fuelLiters: Number(fuelLiters),
        costPerLiter: Number(costPerLiter),
        totalCost: calculatedTotal,
        fuelType,
        gasStationName: gasStationName.trim() || undefined,
        fullTank,
        invoiceNumber: invoiceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      await recordMutation.mutateAsync({ vehicleId: truck.id, data: payload });
      enqueueSnackbar("Fuel refill log saved", { variant: "success" });
      onClose();
    } catch {
      enqueueSnackbar("Failed to record fuel log", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Record Fuel Consumption Refill</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField
              label="Refill Date"
              type="date"
              size="small"
              required
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Odometer Reading (km)"
              type="number"
              size="small"
              required
              value={odometerKm}
              onChange={(e) => setOdometerKm(e.target.value)}
            />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField
              label="Fuel Volume (Liters)"
              type="number"
              size="small"
              required
              value={fuelLiters}
              onChange={(e) => setFuelLiters(e.target.value)}
              slotProps={{ input: { endAdornment: <InputAdornment position="end">L</InputAdornment> } }}
            />
            <TextField
              label="Price per Liter"
              type="number"
              size="small"
              required
              value={costPerLiter}
              onChange={(e) => setCostPerLiter(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start">Rp</InputAdornment> } }}
            />
          </Box>

          <TextField
            label="Total Fuel Cost"
            size="small"
            disabled
            value={calculatedTotal.toLocaleString()}
            slotProps={{ input: { startAdornment: <InputAdornment position="start">Rp</InputAdornment> } }}
          />

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <FormControl size="small">
              <InputLabel>Fuel Type</InputLabel>
              <Select value={fuelType} label="Fuel Type" onChange={(e) => setFuelType(e.target.value)}>
                <MenuItem value="SOLAR">Bio Solar / B35</MenuItem>
                <MenuItem value="DEXLITE">Dexlite</MenuItem>
                <MenuItem value="PERTAMINA_DEX">Pertamina Dex</MenuItem>
                <MenuItem value="PERTALITE">Pertalite (RON 90)</MenuItem>
                <MenuItem value="PERTAMAX">Pertamax (RON 92)</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>Fill Type</InputLabel>
              <Select value={fullTank ? "FULL" : "PARTIAL"} label="Fill Type" onChange={(e) => setFullTank(e.target.value === "FULL")}>
                <MenuItem value="FULL">Full Tank (Accurate Efficiency)</MenuItem>
                <MenuItem value="PARTIAL">Partial Refill</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TextField
            label="Gas Station / SPBU Location"
            size="small"
            value={gasStationName}
            onChange={(e) => setGasStationName(e.target.value)}
            placeholder="e.g. SPBU Pertamina 34-11401 Daan Mogot"
          />

          <TextField
            label="Receipt / Invoice Number"
            size="small"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="e.g. STRUUK-SPBU-8921"
          />

          <TextField
            label="Notes"
            size="small"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional refuel notes"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? "Saving..." : "Save Refuel Record"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// DIALOG: REPORT DAMAGE INCIDENT
// ══════════════════════════════════════════════════════════════════════════

export function ReportIncidentDialog({
  open,
  truck,
  onClose,
}: {
  open: boolean;
  truck: VehicleDto;
  onClose: () => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const reportMutation = useReportIncident();

  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split("T")[0]);
  const [incidentType, setIncidentType] = useState("SCRATCH_DENT");
  const [severity, setSeverity] = useState("LOW");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [thirdPartyInvolved, setThirdPartyInvolved] = useState(false);
  const [thirdPartyDetails, setThirdPartyDetails] = useState("");
  const [policeReportNumber, setPoliceReportNumber] = useState("");
  const [estimatedRepairCost, setEstimatedRepairCost] = useState("0");
  const [insuranceClaimed, setInsuranceClaimed] = useState(false);
  const [insuranceClaimNumber, setInsuranceClaimNumber] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      enqueueSnackbar("Incident description is required", { variant: "warning" });
      return;
    }
    setSaving(true);
    try {
      const payload: CreateIncidentReportRequest = {
        incidentDate,
        reporterEmployeeId: truck.driverEmployeeId,
        incidentType,
        severity,
        location: location.trim() || undefined,
        description: description.trim(),
        thirdPartyInvolved,
        thirdPartyDetails: thirdPartyDetails.trim() || undefined,
        policeReportNumber: policeReportNumber.trim() || undefined,
        estimatedRepairCost: Number(estimatedRepairCost) || 0,
        insuranceClaimed,
        insuranceClaimNumber: insuranceClaimNumber.trim() || undefined,
      };
      await reportMutation.mutateAsync({ vehicleId: truck.id, data: payload });
      enqueueSnackbar("Damage incident reported successfully", { variant: "success" });
      onClose();
    } catch {
      enqueueSnackbar("Failed to report incident", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ color: "error.main", display: "flex", alignItems: "center", gap: 1 }}>
          <ReportProblemIcon /> Report Vehicle Damage / Incident
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField
              label="Incident Date"
              type="date"
              size="small"
              required
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <FormControl size="small" required>
              <InputLabel>Severity</InputLabel>
              <Select value={severity} label="Severity" onChange={(e) => setSeverity(e.target.value)}>
                <MenuItem value="LOW">Low (Minor scratches / Cosmetic)</MenuItem>
                <MenuItem value="MEDIUM">Medium (Dents, Tail-lamp cracked)</MenuItem>
                <MenuItem value="HIGH">High (Radiator leak, Suspension damaged)</MenuItem>
                <MenuItem value="CRITICAL">Critical (Collision, Engine dead - Ground vehicle)</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <FormControl size="small" required>
            <InputLabel>Incident Type</InputLabel>
            <Select value={incidentType} label="Incident Type" onChange={(e) => setIncidentType(e.target.value)}>
              <MenuItem value="SCRATCH_DENT">Body Scratch or Dent</MenuItem>
              <MenuItem value="COLLISION_MINOR">Minor Collision (Bump / Fender)</MenuItem>
              <MenuItem value="COLLISION_MAJOR">Major Collision (Structural Damage)</MenuItem>
              <MenuItem value="FLAT_TYRE">Tire Blowout / Puncture</MenuItem>
              <MenuItem value="ENGINE_BREAKDOWN">Engine / Transmission Breakdown</MenuItem>
              <MenuItem value="WINDSHIELD_CRACK">Windshield / Window Crack</MenuItem>
              <MenuItem value="CARGO_DAMAGE_IN_TRANSIT">Cargo Shift / Box Damaged</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Location of Incident"
            size="small"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Jl. Raya Pantura KM 42, Karawang"
          />

          <TextField
            label="Incident Description *"
            size="small"
            required
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed chronological description of what occurred, weather, road condition, and exact damage..."
          />

          <TextField
            label="Estimated Repair Cost (Rp)"
            type="number"
            size="small"
            value={estimatedRepairCost}
            onChange={(e) => setEstimatedRepairCost(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start">Rp</InputAdornment> } }}
          />

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <FormControl size="small">
              <InputLabel>Third-Party Involved?</InputLabel>
              <Select value={thirdPartyInvolved ? "YES" : "NO"} label="Third-Party Involved?" onChange={(e) => setThirdPartyInvolved(e.target.value === "YES")}>
                <MenuItem value="NO">No (Single Vehicle Incident)</MenuItem>
                <MenuItem value="YES">Yes (Other Vehicle / Property)</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Insurance Claim?</InputLabel>
              <Select value={insuranceClaimed ? "YES" : "NO"} label="Insurance Claim?" onChange={(e) => setInsuranceClaimed(e.target.value === "YES")}>
                <MenuItem value="NO">No Insurance Claim</MenuItem>
                <MenuItem value="YES">Claim Processed</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {thirdPartyInvolved && (
            <TextField
              label="Third Party Details & Plate"
              size="small"
              value={thirdPartyDetails}
              onChange={(e) => setThirdPartyDetails(e.target.value)}
              placeholder="e.g. Sepeda motor Honda Vario B 1234 CD, pengendara tidak terluka"
            />
          )}

          {insuranceClaimed && (
            <TextField
              label="Insurance Claim Number"
              size="small"
              value={insuranceClaimNumber}
              onChange={(e) => setInsuranceClaimNumber(e.target.value)}
              placeholder="e.g. CLM-ASTRA-2026-9912"
            />
          )}

          <TextField
            label="Police Report Number (if applicable)"
            size="small"
            value={policeReportNumber}
            onChange={(e) => setPoliceReportNumber(e.target.value)}
            placeholder="e.g. LP/B/992/XI/2026/SPKT"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="contained" color="error" disabled={saving}>
            {saving ? "Submitting..." : "Submit Incident Report"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

