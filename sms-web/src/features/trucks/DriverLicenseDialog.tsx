import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
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
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import BadgeIcon from "@mui/icons-material/Badge";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CancelIcon from "@mui/icons-material/Cancel";
import { useSnackbar } from "notistack";
import {
  useDriverLicenses,
  useCreateDriverLicense,
  useUpdateDriverLicense,
  useDeleteDriverLicense,
  useSendLicenseRenewalReminder,
} from "./hooks";
import type {
  CreateDriverLicenseRequest,
  DriverLicenseDto,
  DriverLicenseType,
} from "../fleet/fleetApi";
import { formatDate, useLanguage } from "../../lib/locale";

interface DriverLicenseDialogProps {
  open: boolean;
  employeeId: string | null;
  driverName: string;
  onClose: () => void;
}

const LICENSE_TYPES: { value: DriverLicenseType; label: string }[] = [
  { value: "SIM_B1_UMUM", label: "SIM B1 Umum — Commercial Freight & Trucks" },
  { value: "SIM_B1", label: "SIM B1 — Private Truck / Bus (>3,500 kg)" },
  { value: "SIM_A", label: "SIM A — Passenger Car & Light Pick-up" },
  { value: "SIM_B2_UMUM", label: "SIM B2 Umum — Heavy Articulated Prime Mover" },
  { value: "SIM_B2", label: "SIM B2 — Articulated / Heavy Vehicle" },
  { value: "SIM_C", label: "SIM C — Motorcycle / Two-Wheeler" },
];

export function DriverLicenseDialog({
  open,
  employeeId,
  driverName,
  onClose,
}: DriverLicenseDialogProps) {
  const language = useLanguage();
  const { enqueueSnackbar } = useSnackbar();

  // Queries & Mutations
  const { data: licenses = [], isLoading } = useDriverLicenses(employeeId);
  const createMutation = useCreateDriverLicense();
  const updateMutation = useUpdateDriverLicense();
  const deleteMutation = useDeleteDriverLicense();
  const reminderMutation = useSendLicenseRenewalReminder();

  // Form modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<DriverLicenseDto | null>(null);

  const handleSendReminder = async (lic: DriverLicenseDto) => {
    try {
      await reminderMutation.mutateAsync({
        licenseId: lic.id,
        employeeId: lic.employeeId,
      });
      enqueueSnackbar(`Renewal reminder notification sent to ${lic.driverName}`, { variant: "success" });
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || err.message || "Failed to send notification", {
        variant: "error",
      });
    }
  };

  const handleDelete = async (lic: DriverLicenseDto) => {
    if (!window.confirm(`Delete driver license ${lic.licenseNumber}?`)) return;
    try {
      await deleteMutation.mutateAsync({
        licenseId: lic.id,
        employeeId: lic.employeeId,
      });
      enqueueSnackbar("Driver license deleted", { variant: "info" });
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || err.message || "Failed to delete", { variant: "error" });
    }
  };

  if (!employeeId) return null;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <BadgeIcon color="primary" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                Driving Licenses (SIM) — {driverName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Official commercial driver permit registry & automated Samsat expiry notification tracker
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Header Action */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Registered Permits ({licenses.length})
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingLicense(null);
                setFormOpen(true);
              }}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Add Driving License
            </Button>
          </Box>

          {/* Licenses List */}
          {isLoading ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">Loading driving licenses...</Typography>
            </Box>
          ) : licenses.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
              <BadgeIcon sx={{ fontSize: 40, color: "text.secondary", mb: 1 }} />
              <Typography variant="body1" sx={{ fontWeight: 600 }}>No driving license registered</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                Commercial delivery drivers must have a registered SIM (e.g. SIM B1 Umum) to ensure legal compliance.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingLicense(null);
                  setFormOpen(true);
                }}
              >
                Register SIM Now
              </Button>
            </Paper>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: "background.default" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>SIM Number</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>License Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Expiry Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Issuing Office</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Last Notification</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {licenses.map((lic) => {
                    const isExpired = lic.status === "EXPIRED";
                    const isExpiringSoon = lic.status === "EXPIRING_SOON";
                    const isValid = lic.status === "VALID";

                    return (
                      <TableRow key={lic.id} hover>
                        <TableCell sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                          {lic.licenseNumber}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={lic.licenseType.replace(/_/g, " ")}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                          />
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {formatDate(lic.expiryDate, language)}
                        </TableCell>
                        <TableCell>
                          {isExpired && (
                            <Chip
                              label={`Expired (${Math.abs(lic.daysRemaining || 0)}d)`}
                              size="small"
                              color="error"
                              icon={<CancelIcon fontSize="small" />}
                              sx={{ fontWeight: 700 }}
                            />
                          )}
                          {isExpiringSoon && (
                            <Chip
                              label={`Expiring in ${lic.daysRemaining}d`}
                              size="small"
                              color="warning"
                              icon={<WarningAmberIcon fontSize="small" />}
                              sx={{ fontWeight: 700 }}
                            />
                          )}
                          {isValid && (
                            <Chip
                              label={`Valid (${lic.daysRemaining}d)`}
                              size="small"
                              color="success"
                              variant="outlined"
                              icon={<CheckCircleIcon fontSize="small" />}
                            />
                          )}
                        </TableCell>
                        <TableCell>{lic.issuingPoliceOffice || "-"}</TableCell>
                        <TableCell sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                          {lic.lastNotificationSentAt
                            ? formatDate(lic.lastNotificationSentAt, language, { dateStyle: "short", timeStyle: "short" })
                            : "None sent"}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: "inline-flex", gap: 0.5 }}>
                            <Tooltip title="Send Expiry Reminder Notification to Driver">
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={() => handleSendReminder(lic)}
                                disabled={reminderMutation.isPending}
                              >
                                <NotificationsActiveIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit / Renew SIM">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setEditingLicense(lic);
                                  setFormOpen(true);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete SIM">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(lic)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Info Card on Proactive Notifications */}
          <Alert severity="info" sx={{ mt: 1 }}>
            <strong>Proactive 30-Day Expiry Notification:</strong> The system automatically monitors driving license expiration dates daily at 07:00 AM. When a driver's SIM enters the 30-day expiration window, an in-app and mobile push notification is automatically delivered to the driver, ensuring prompt renewal at Satpas Samsat before expiry.
          </Alert>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Form Dialog: Add or Edit License */}
      {formOpen && (
        <DriverLicenseFormModal
          open={formOpen}
          initialData={editingLicense}
          onClose={() => {
            setFormOpen(false);
            setEditingLicense(null);
          }}
          onSave={async (formData) => {
            try {
              if (editingLicense) {
                await updateMutation.mutateAsync({
                  licenseId: editingLicense.id,
                  employeeId,
                  data: formData,
                });
                enqueueSnackbar("Driver license updated successfully", { variant: "success" });
              } else {
                await createMutation.mutateAsync({
                  employeeId,
                  data: formData,
                });
                enqueueSnackbar("Driver license registered successfully", { variant: "success" });
              }
              setFormOpen(false);
              setEditingLicense(null);
            } catch (err: any) {
              enqueueSnackbar(err.response?.data?.message || err.message || "Failed to save license", {
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
// Sub-component: Form Dialog
// ─────────────────────────────────────────────────────────────
function DriverLicenseFormModal({
  open,
  initialData,
  onClose,
  onSave,
}: {
  open: boolean;
  initialData: DriverLicenseDto | null;
  onClose: () => void;
  onSave: (data: CreateDriverLicenseRequest) => Promise<void>;
}) {
  const [licenseNumber, setLicenseNumber] = useState(initialData?.licenseNumber || "");
  const [licenseType, setLicenseType] = useState<DriverLicenseType>(initialData?.licenseType || "SIM_B1_UMUM");
  const [issueDate, setIssueDate] = useState(initialData?.issueDate || "");
  const [expiryDate, setExpiryDate] = useState(initialData?.expiryDate || "");
  const [issuingPoliceOffice, setIssuingPoliceOffice] = useState(initialData?.issuingPoliceOffice || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseNumber.trim() || !expiryDate) return;
    setSaving(true);
    try {
      await onSave({
        licenseNumber: licenseNumber.trim().toUpperCase(),
        licenseType,
        issueDate: issueDate || undefined,
        expiryDate,
        issuingPoliceOffice: issuingPoliceOffice.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {initialData ? "Edit / Renew Driving License" : "Register Driving License (SIM)"}
        </DialogTitle>
        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="SIM Number *"
            size="small"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            placeholder="e.g. 9812-3456-7890"
            required
            helperText="Nomor Surat Izin Mengemudi dari Kepolisian RI"
          />

          <FormControl size="small" required>
            <InputLabel>License Type (Golongan SIM)</InputLabel>
            <Select
              value={licenseType}
              label="License Type (Golongan SIM)"
              onChange={(e) => setLicenseType(e.target.value as DriverLicenseType)}
            >
              {LICENSE_TYPES.map((lt) => (
                <MenuItem key={lt.value} value={lt.value}>
                  {lt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField
              label="Issue Date"
              type="date"
              size="small"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Expiry Date *"
              type="date"
              size="small"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              required
              helperText="Tanggal kadaluarsa masa berlaku SIM (5 tahun)"
            />
          </Box>

          <TextField
            label="Issuing Office / Satpas"
            size="small"
            value={issuingPoliceOffice}
            onChange={(e) => setIssuingPoliceOffice(e.target.value)}
            placeholder="e.g. Satpas Daan Mogot Polda Metro Jaya"
          />

          <TextField
            label="Notes"
            size="small"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Dedicated delivery truck driver, verified physically"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? "Saving..." : "Save License"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
