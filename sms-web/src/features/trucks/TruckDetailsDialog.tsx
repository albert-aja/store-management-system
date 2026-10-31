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
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import BuildIcon from "@mui/icons-material/Build";
import SpeedIcon from "@mui/icons-material/Speed";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CancelIcon from "@mui/icons-material/Cancel";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import RouteIcon from "@mui/icons-material/Route";
import { useSnackbar } from "notistack";
import {
  useServiceLogs,
  useRecordServiceLog,
  useTruckTravelDistance,
  useMonthlyHealthChecks,
  useRecordMonthlyHealthCheck,
} from "./hooks";
import type {
  CreateVehicleServiceLogRequest,
  CreateVehicleMonthlyHealthCheckRequest,
  VehicleDto,
} from "../fleet/fleetApi";
import { formatDate,  formatCurrency, useLanguage } from "../../lib/locale";

interface TruckDetailsDialogProps {
  open: boolean;
  truck: VehicleDto | null;
  onClose: () => void;
}

export function TruckDetailsDialog({ open, truck, onClose }: TruckDetailsDialogProps) {
  const language = useLanguage();
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState(0);

  // Modals for recording new entries
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [healthModalOpen, setHealthModalOpen] = useState(false);

  const vehicleId = truck?.id ?? null;

  // Data queries
  const { data: serviceLogs = [], isLoading: logsLoading } = useServiceLogs(vehicleId);
  const { data: travelDistance, isLoading: travelLoading } = useTruckTravelDistance(vehicleId);
  const { data: healthChecks = [], isLoading: healthLoading } = useMonthlyHealthChecks(vehicleId);

  // Mutations
  const recordServiceMutation = useRecordServiceLog();
  const recordHealthMutation = useRecordMonthlyHealthCheck();

  // Service Log KPI
  const totalServiceSpend = useMemo(() => {
    return serviceLogs.reduce((sum, item) => sum + (Number(item.costAmount) || 0), 0);
  }, [serviceLogs]);

  if (!truck) return null;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                bgcolor: "#1a1a1a",
                color: "#fff",
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                border: "2px solid #333",
                fontWeight: 700,
                fontSize: "0.9rem",
                fontFamily: "monospace",
              }}
            >
              {truck.registrationNumber}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {truck.brandModel}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {truck.vehicleType.replace(/_/g, " ")} • Driver: {truck.driverName || "Unassigned"} • {truck.storeName || "Central Store"}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {/* Tab Header */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
          <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
            <Tab
              icon={<BuildIcon fontSize="small" />}
              iconPosition="start"
              label={`Service Logs (${serviceLogs.length})`}
              sx={{ textTransform: "none", fontWeight: 600 }}
            />
            <Tab
              icon={<SpeedIcon fontSize="small" />}
              iconPosition="start"
              label="Travelled Distance (GPS)"
              sx={{ textTransform: "none", fontWeight: 600 }}
            />
            <Tab
              icon={<HealthAndSafetyIcon fontSize="small" />}
              iconPosition="start"
              label={`Monthly Health Check (${healthChecks.length})`}
              sx={{ textTransform: "none", fontWeight: 600 }}
            />
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 2.5, minHeight: 480 }}>
          {/* ══════════════ TAB 0: SERVICE LOGS ══════════════ */}
          {activeTab === 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {/* Summary Cards */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
                      Total Maintenance Cost
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: "primary.main" }}>
                      {formatCurrency(totalServiceSpend, language)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Cumulative workshop & parts expense
                    </Typography>
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
                      Last Service Recorded
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {truck.lastServiceDate ? formatDate(truck.lastServiceDate, language) : "None"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      At {truck.lastServiceOdometerKm ? `${truck.lastServiceOdometerKm.toLocaleString()} km` : "initial km"}
                    </Typography>
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
                      Service Interval
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
                      Every {truck.serviceIntervalKm ? `${truck.serviceIntervalKm.toLocaleString()} km` : "10,000 km"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Current: {truck.odometerKm ? `${truck.odometerKm.toLocaleString()} km` : "0 km"}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              {/* Action Bar */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Maintenance & Service Records
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={() => setServiceModalOpen(true)}
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                >
                  Record Service Log
                </Button>
              </Box>

              {/* Service Logs Table */}
              {logsLoading ? (
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">Loading service logs...</Typography>
                </Box>
              ) : serviceLogs.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
                  <ReceiptLongIcon sx={{ fontSize: 40, color: "text.secondary", mb: 1 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>No service logs recorded yet</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Click "Record Service Log" to document routine maintenance, oil changes, or repair costs.
                  </Typography>
                </Paper>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "background.default" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Service Type</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Service Center / Workshop</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Odometer</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Cost Amount</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Invoice #</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Parts Replaced</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {serviceLogs.map((log) => (
                        <TableRow key={log.id} hover>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(log.serviceDate, language)}</TableCell>
                          <TableCell>
                            <Chip
                              label={log.serviceType.replace(/_/g, " ")}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                            />
                          </TableCell>
                          <TableCell>{log.serviceCenterName || "-"}</TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {log.odometerKm ? `${log.odometerKm.toLocaleString()} km` : "-"}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: "success.main", whiteSpace: "nowrap" }}>
                            {log.costAmount ? formatCurrency(Number(log.costAmount), language) : "Rp 0"}
                          </TableCell>
                          <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{log.invoiceNumber || "-"}</TableCell>
                          <TableCell>{log.partsReplaced || "-"}</TableCell>
                          <TableCell>{log.notes || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* ══════════════ TAB 1: TRAVELLED DISTANCE ══════════════ */}
          {activeTab === 1 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {/* Summary Cards */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 2 }}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
                      All-Time Delivery Distance
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: "primary.main" }}>
                      {travelDistance?.totalDeliveryDistanceKm?.toLocaleString() ?? "0"} km
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Calculated from GPS tracking sessions
                    </Typography>
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
                      Current Month Distance
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: "info.main" }}>
                      {travelDistance?.currentMonthDeliveryDistanceKm?.toLocaleString() ?? "0"} km
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Active delivery travel this month
                    </Typography>
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
                      Completed Trips
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {travelDistance?.completedDeliveryTripsCount ?? 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Verified completed delivery tasks
                    </Typography>
                  </CardContent>
                </Card>

                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    borderColor: travelDistance?.isServiceDue ? "warning.main" : "divider",
                    bgcolor: travelDistance?.isServiceDue ? "warning.50" : "background.paper",
                  }}
                >
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="caption" color={travelDistance?.isServiceDue ? "warning.dark" : "text.secondary"} sx={{ fontWeight: 600, textTransform: "uppercase" }}>
                        KM Since Last Service
                      </Typography>
                      {travelDistance?.isServiceDue && <WarningAmberIcon fontSize="small" color="warning" />}
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: travelDistance?.isServiceDue ? "warning.dark" : "text.primary" }}>
                      {travelDistance?.kmSinceLastService !== undefined ? `${travelDistance.kmSinceLastService.toLocaleString()} km` : "0 km"}
                    </Typography>
                    <Typography variant="caption" color={travelDistance?.isServiceDue ? "warning.dark" : "text.secondary"}>
                      {travelDistance?.isServiceDue ? "Service interval reached!" : "Within recommended interval"}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              {/* Delivery Trips Table */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Recent Delivery Trips & Mileage Breakdowns
              </Typography>

              {travelLoading ? (
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">Loading trip distances...</Typography>
                </Box>
              ) : !travelDistance?.recentTrips || travelDistance.recentTrips.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
                  <RouteIcon sx={{ fontSize: 40, color: "text.secondary", mb: 1 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>No delivery tracking sessions yet</Typography>
                  <Typography variant="caption" color="text.secondary">
                    When the assigned driver completes delivery tasks with GPS tracking enabled, trip distances will be logged automatically here.
                  </Typography>
                </Paper>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "background.default" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Task Code</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Driver</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Start Time</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>End Time</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Distance (km)</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {travelDistance.recentTrips.map((trip) => (
                        <TableRow key={trip.sessionId} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{trip.taskCode || "Delivery Task"}</TableCell>
                          <TableCell>{trip.driverName || truck.driverName || "-"}</TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {trip.startTime ? formatDate(trip.startTime, language, { dateStyle: "short", timeStyle: "short" }) : "-"}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {trip.endTime ? formatDate(trip.endTime, language, { dateStyle: "short", timeStyle: "short" }) : "-"}
                          </TableCell>
                          <TableCell>{trip.durationMinutes ? `${trip.durationMinutes} mins` : "-"}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: "primary.main" }}>
                            {trip.distanceKm ? `${trip.distanceKm.toFixed(2)} km` : "0.00 km"}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={trip.status || "COMPLETED"}
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{ fontSize: "0.75rem" }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* ══════════════ TAB 2: MONTHLY HEALTH CHECK ══════════════ */}
          {activeTab === 2 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {/* Action Bar */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Monthly Vehicle Health & Roadworthiness Inspections
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Regular multi-point safety inspection (oil, brakes, tire wear & pressure, APAR, cargo box)
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={() => setHealthModalOpen(true)}
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                >
                  Conduct Monthly Inspection
                </Button>
              </Box>

              {healthLoading ? (
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">Loading inspections...</Typography>
                </Box>
              ) : healthChecks.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
                  <HealthAndSafetyIcon sx={{ fontSize: 40, color: "text.secondary", mb: 1 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>No monthly inspections recorded yet</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Perform monthly safety checks to prevent roadside breakdowns and ensure roadworthiness certification.
                  </Typography>
                </Paper>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {healthChecks.map((chk) => {
                    const isHealthy = chk.overallRating === "HEALTHY";
                    const isAttention = chk.overallRating === "ATTENTION_NEEDED";
                    const isUnfit = chk.overallRating === "UNFIT_FOR_ROAD";

                    return (
                      <Card
                        key={chk.id}
                        variant="outlined"
                        sx={{
                          borderRadius: 2,
                          borderLeft: "6px solid",
                          borderLeftColor: isHealthy ? "success.main" : isAttention ? "warning.main" : "error.main",
                        }}
                      >
                        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                          {/* Card Header */}
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                Inspection Date: {formatDate(chk.checkDate, language)}
                              </Typography>
                              <Chip
                                label={
                                  isHealthy
                                    ? "HEALTHY / ROADWORTHY"
                                    : isAttention
                                    ? "ATTENTION NEEDED"
                                    : "UNFIT FOR ROAD"
                                }
                                size="small"
                                color={isHealthy ? "success" : isAttention ? "warning" : "error"}
                                icon={
                                  isHealthy ? (
                                    <CheckCircleIcon fontSize="small" />
                                  ) : isAttention ? (
                                    <WarningAmberIcon fontSize="small" />
                                  ) : (
                                    <CancelIcon fontSize="small" />
                                  )
                                }
                                sx={{ fontWeight: 700 }}
                              />
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Inspector: <strong>{chk.inspectorName || "Workshop Tech"}</strong> • Odometer:{" "}
                              <strong>{chk.odometerKm ? `${chk.odometerKm.toLocaleString()} km` : "-"}</strong>
                            </Typography>
                          </Box>

                          {/* Inspection Points Grid */}
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(5, 1fr)" },
                              gap: 1.5,
                              p: 1.5,
                              bgcolor: "background.default",
                              borderRadius: 1.5,
                            }}
                          >
                            <Box>
                              <Typography variant="caption" color="text.secondary">Engine Oil</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{chk.engineOilStatus || "OK"}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Radiator Coolant</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{chk.coolantStatus || "OK"}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Brake Condition</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{chk.brakeCondition || "GOOD"}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Tire Condition</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{chk.tireCondition || "GOOD"}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Battery</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{chk.batteryHealth || "GOOD"}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Headlamps & Lights</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{chk.lightsStatus || "FUNCTIONAL"}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Safety / APAR</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{chk.safetyEquipmentStatus || "PRESENT"}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Cargo Box</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{chk.cargoBoxCondition || "INTACT"}</Typography>
                            </Box>
                          </Box>

                          {/* Action Required Alert */}
                          {chk.actionRequired && (
                            <Alert severity={isUnfit ? "error" : "warning"} sx={{ mt: 1.5, py: 0 }}>
                              <strong>Action Required:</strong> {chk.actionRequired}
                            </Alert>
                          )}
                          {chk.notes && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                              Notes: {chk.notes}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Nested Modal: Add Service Log */}
      {serviceModalOpen && (
        <ServiceLogFormModal
          open={serviceModalOpen}
          vehicleId={truck.id}
          currentOdometer={truck.odometerKm}
          onClose={() => setServiceModalOpen(false)}
          onSave={async (data) => {
            try {
              await recordServiceMutation.mutateAsync({ vehicleId: truck.id, data });
              enqueueSnackbar("Service log recorded successfully", { variant: "success" });
              setServiceModalOpen(false);
            } catch (err: any) {
              enqueueSnackbar(err.response?.data?.message || err.message || "Failed to record service", {
                variant: "error",
              });
            }
          }}
        />
      )}

      {/* Nested Modal: Add Monthly Health Check */}
      {healthModalOpen && (
        <MonthlyHealthCheckModal
          open={healthModalOpen}
          vehicleId={truck.id}
          currentOdometer={truck.odometerKm}
          onClose={() => setHealthModalOpen(false)}
          onSave={async (data) => {
            try {
              await recordHealthMutation.mutateAsync({ vehicleId: truck.id, data });
              enqueueSnackbar("Monthly health check recorded successfully", { variant: "success" });
              setHealthModalOpen(false);
            } catch (err: any) {
              enqueueSnackbar(err.response?.data?.message || err.message || "Failed to record check", {
                variant: "error",
              });
            }
          }}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-dialog: Service Log Form
// ─────────────────────────────────────────────────────────────
function ServiceLogFormModal({
  open,
  currentOdometer,
  onClose,
  onSave,
}: {
  open: boolean;
  vehicleId?: string;
  currentOdometer?: number;
  onClose: () => void;
  onSave: (data: CreateVehicleServiceLogRequest) => Promise<void>;
}) {
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [serviceType, setServiceType] = useState("ROUTINE_MAINTENANCE");
  const [serviceCenter, setServiceCenter] = useState("");
  const [odometerKm, setOdometerKm] = useState<string>(currentOdometer ? String(currentOdometer) : "");
  const [costAmount, setCostAmount] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [partsReplaced, setPartsReplaced] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceDate || !odometerKm) return;
    setSaving(true);
    try {
      await onSave({
        serviceDate,
        serviceType,
        serviceCenterName: serviceCenter.trim() || undefined,
        odometerKm: Number(odometerKm),
        costAmount: costAmount ? Number(costAmount) : undefined,
        invoiceNumber: invoiceNumber.trim() || undefined,
        partsReplaced: partsReplaced.trim() || undefined,
        notes: description.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>Record Vehicle Service Log</DialogTitle>
        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField
              label="Service Date *"
              type="date"
              size="small"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              required
            />
            <FormControl size="small" required>
              <InputLabel>Service Type</InputLabel>
              <Select value={serviceType} label="Service Type" onChange={(e) => setServiceType(e.target.value)}>
                <MenuItem value="ROUTINE_MAINTENANCE">Routine Maintenance</MenuItem>
                <MenuItem value="OIL_CHANGE">Oil Change</MenuItem>
                <MenuItem value="TIRE_ROTATION_REPLACEMENT">Tire Rotation / Replacement</MenuItem>
                <MenuItem value="BRAKE_SERVICE">Brake System Service</MenuItem>
                <MenuItem value="ENGINE_OVERHAUL">Engine Overhaul</MenuItem>
                <MenuItem value="ELECTRICAL_REPAIR">Electrical Repair</MenuItem>
                <MenuItem value="EMERGENCY_REPAIR">Emergency Roadside Repair</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField
              label="Odometer (KM) *"
              type="number"
              size="small"
              value={odometerKm}
              onChange={(e) => setOdometerKm(e.target.value)}
              required
              helperText="Updates current vehicle odometer reading"
            />
            <TextField
              label="Total Cost (IDR)"
              type="number"
              size="small"
              value={costAmount}
              onChange={(e) => setCostAmount(e.target.value)}
              placeholder="e.g. 1500000"
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                },
              }}
            />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField
              label="Service Center / Bengkel"
              size="small"
              value={serviceCenter}
              onChange={(e) => setServiceCenter(e.target.value)}
              placeholder="e.g. Bengkel Resmi Isuzu Astra"
            />
            <TextField
              label="Invoice / Receipt Number"
              size="small"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="e.g. INV-2026-X81"
            />
          </Box>

          <TextField
            label="Parts Replaced"
            size="small"
            value={partsReplaced}
            onChange={(e) => setPartsReplaced(e.target.value)}
            placeholder="e.g. Oli mesin 15W-40, filter oli, kampas rem depan"
            multiline
            rows={2}
          />

          <TextField
            label="Notes / Mechanic Remarks"
            size="small"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Good engine compression, next check at 60,000 km"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? "Saving..." : "Save Service Log"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-dialog: Monthly Health Check Form
// ─────────────────────────────────────────────────────────────
function MonthlyHealthCheckModal({
  open,
  currentOdometer,
  onClose,
  onSave,
}: {
  open: boolean;
  vehicleId?: string;
  currentOdometer?: number;
  onClose: () => void;
  onSave: (data: CreateVehicleMonthlyHealthCheckRequest) => Promise<void>;
}) {
  const [checkDate, setCheckDate] = useState(new Date().toISOString().split("T")[0]);
  const [overallRating, setOverallRating] = useState("HEALTHY");
  const [inspectorName, setInspectorName] = useState("");
  const [odometerKm, setOdometerKm] = useState<string>(currentOdometer ? String(currentOdometer) : "");

  const [engineOilStatus, setEngineOilStatus] = useState("OK");
  const [coolantStatus, setCoolantStatus] = useState("OK");
  const [brakeFluidStatus, setBrakeFluidStatus] = useState("OK");
  const [brakeCondition, setBrakeCondition] = useState("GOOD");
  const [tireCondition, setTireCondition] = useState("GOOD");
  const [batteryHealth, setBatteryHealth] = useState("GOOD");
  const [lightsStatus, setLightsStatus] = useState("FUNCTIONAL");
  const [safetyEquipmentStatus, setSafetyEquipmentStatus] = useState("PRESENT");
  const [cargoBoxCondition, setCargoBoxCondition] = useState("INTACT");
  const [actionRequired, setActionRequired] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        checkDate,
        overallRating,
        inspectorName: inspectorName.trim() || undefined,
        odometerKm: odometerKm ? Number(odometerKm) : undefined,
        engineOilStatus,
        coolantStatus,
        brakeFluidStatus,
        brakeCondition,
        tireCondition,
        batteryHealth,
        lightsStatus,
        safetyEquipmentStatus,
        cargoBoxCondition,
        actionRequired: actionRequired.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>Monthly Vehicle Roadworthiness Inspection</DialogTitle>
        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Top Info */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
            <TextField
              label="Inspection Date *"
              type="date"
              size="small"
              value={checkDate}
              onChange={(e) => setCheckDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              required
            />
            <TextField
              label="Inspector / Mechanic Name"
              size="small"
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              placeholder="e.g. Inspector Rudi"
            />
            <TextField
              label="Current Odometer (KM)"
              type="number"
              size="small"
              value={odometerKm}
              onChange={(e) => setOdometerKm(e.target.value)}
            />
          </Box>

          {/* Overall Rating */}
          <FormControl fullWidth size="small">
            <InputLabel>Overall Roadworthiness Rating *</InputLabel>
            <Select
              value={overallRating}
              label="Overall Roadworthiness Rating *"
              onChange={(e) => setOverallRating(e.target.value)}
            >
              <MenuItem value="HEALTHY">HEALTHY / ROADWORTHY (Safe for all delivery routes)</MenuItem>
              <MenuItem value="ATTENTION_NEEDED">ATTENTION NEEDED (Minor defects, monitor closely)</MenuItem>
              <MenuItem value="UNFIT_FOR_ROAD">UNFIT FOR ROAD (Immediate workshop grounding, flags vehicle as MAINTENANCE)</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 0.5 }}>
            Multi-Point Physical Checklist
          </Typography>

          {/* Checklist Items */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 2 }}>
            <FormControl size="small">
              <InputLabel>Engine Oil</InputLabel>
              <Select value={engineOilStatus} label="Engine Oil" onChange={(e) => setEngineOilStatus(e.target.value)}>
                <MenuItem value="OK">OK (Clear / Normal Level)</MenuItem>
                <MenuItem value="DIRTY">Dirty / Blackened (Needs Change)</MenuItem>
                <MenuItem value="LOW">Low Oil Level</MenuItem>
                <MenuItem value="CRITICAL">Critical / Leaking</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>Radiator Coolant</InputLabel>
              <Select value={coolantStatus} label="Radiator Coolant" onChange={(e) => setCoolantStatus(e.target.value)}>
                <MenuItem value="OK">OK (Full Reservoir)</MenuItem>
                <MenuItem value="LOW">Low Reservoir Level</MenuItem>
                <MenuItem value="LEAKING">Leaking Radiator / Hose</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>Brake Fluid & Lines</InputLabel>
              <Select value={brakeFluidStatus} label="Brake Fluid & Lines" onChange={(e) => setBrakeFluidStatus(e.target.value)}>
                <MenuItem value="OK">OK (Proper Level)</MenuItem>
                <MenuItem value="LOW">Low Fluid</MenuItem>
                <MenuItem value="LEAKING">Moisture / Leaking Lines</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>Brake Pads & Shoes</InputLabel>
              <Select value={brakeCondition} label="Brake Pads & Shoes" onChange={(e) => setBrakeCondition(e.target.value)}>
                <MenuItem value="GOOD">Good Thickness (&gt; 50%)</MenuItem>
                <MenuItem value="WORN_DOWN">Worn Down (&lt; 30%)</MenuItem>
                <MenuItem value="WORN_OUT">Worn Out / Squeaking (Replace Now)</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>Tire Condition & Tread</InputLabel>
              <Select value={tireCondition} label="Tire Condition & Tread" onChange={(e) => setTireCondition(e.target.value)}>
                <MenuItem value="GOOD">Good Tread Depth</MenuItem>
                <MenuItem value="WARNING_LOW_TREAD">Low Tread / Uneven Wear</MenuItem>
                <MenuItem value="BALD">Bald / Bulging / Cracked (Replace Now)</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>Battery (Aki)</InputLabel>
              <Select value={batteryHealth} label="Battery (Aki)" onChange={(e) => setBatteryHealth(e.target.value)}>
                <MenuItem value="GOOD">Good (&gt; 12.6V / Starts Promptly)</MenuItem>
                <MenuItem value="WEAK">Weak Cranking / Sulfated</MenuItem>
                <MenuItem value="DEAD">Dead / Needs Charging or Replacement</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>Headlamps & Signals</InputLabel>
              <Select value={lightsStatus} label="Headlamps & Signals" onChange={(e) => setLightsStatus(e.target.value)}>
                <MenuItem value="FUNCTIONAL">All Functional</MenuItem>
                <MenuItem value="DEFECTIVE_BULB">One or More Bulbs Blown</MenuItem>
                <MenuItem value="DEFECTIVE_WIRING">Wiring / Relay Fault</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>Safety Gear & APAR</InputLabel>
              <Select value={safetyEquipmentStatus} label="Safety Gear & APAR" onChange={(e) => setSafetyEquipmentStatus(e.target.value)}>
                <MenuItem value="PRESENT">APAR Valid & Triangle Present</MenuItem>
                <MenuItem value="EXPIRED_APAR">APAR Expired</MenuItem>
                <MenuItem value="MISSING">Safety Equipment Missing</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>Cargo Box Condition</InputLabel>
              <Select value={cargoBoxCondition} label="Cargo Box Condition" onChange={(e) => setCargoBoxCondition(e.target.value)}>
                <MenuItem value="INTACT">Intact & Weatherproof</MenuItem>
                <MenuItem value="MINOR_DENT">Minor Scratches / Dents</MenuItem>
                <MenuItem value="DAMAGED_LEAK">Roof Leak / Lock Damaged</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TextField
            label="Corrective Action Required"
            size="small"
            value={actionRequired}
            onChange={(e) => setActionRequired(e.target.value)}
            placeholder="e.g. Schedule immediate brake pad replacement and top up coolant before long haul"
          />

          <TextField
            label="General Notes"
            size="small"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Routine monthly check passed; driver warned on gentle braking"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? "Saving..." : "Submit Inspection"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
