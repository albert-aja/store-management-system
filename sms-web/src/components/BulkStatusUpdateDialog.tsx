import { t } from "../lib/locale";
import { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";

export interface StatusOption {
  value: string;
  label: string;
  description?: string;
  color?: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
}

export interface BulkStatusUpdateDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (targetStatus: string, reason?: string) => Promise<void>;
  selectedCount: number;
  title?: string;
  statusOptions: StatusOption[];
  defaultStatus?: string;
  requireReason?: boolean;
  reasonLabel?: string;
}

export default function BulkStatusUpdateDialog({
  open,
  onClose,
  onConfirm,
  selectedCount,
  title = "Pembaruan Status Massal (Bulk Status Update)",
  statusOptions,
  defaultStatus,
  requireReason = false,
  reasonLabel = "Alasan / Catatan Pembaruan (Reason / Notes)",
}: BulkStatusUpdateDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>(
    defaultStatus || (statusOptions[0]?.value ?? "")
  );
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedStatus) return;
    if (requireReason && !reason.trim()) {
      setError(t("A reason is required for this status update."));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onConfirm(selectedStatus, reason.trim() || undefined);
      setReason("");
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Gagal memperbarui status massal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          {t("Anda memilih")} <strong>{selectedCount} {t("item")}</strong> {t("untuk diperbarui secara massal. Pastikan status tujuan dan catatan sudah sesuai ketentuan operasional toko.")}
        </DialogContentText>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel id="bulk-status-select-label">{t("Status Tujuan")}</InputLabel>
          <Select
            labelId="bulk-status-select-label"
            value={selectedStatus}
            label={t("Status Tujuan")}
            onChange={(e) => setSelectedStatus(e.target.value)}
            disabled={submitting}
          >
            {statusOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {opt.label}
                  </Typography>
                  {opt.description && (
                    <Typography variant="caption" color="text.secondary">
                      {opt.description}
                    </Typography>
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label={reasonLabel}
          fullWidth
          multiline
          rows={3}
          size="small"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (error) setError(null);
          }}
          placeholder={t("Masukkan catatan audit operasional...")}
          error={!!error}
          helperText={error}
          disabled={submitting}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          {t("Batal")}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || !selectedStatus}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {submitting
            ? t("Memproses...")
            : t("Apply to {count} Item", undefined, { count: selectedCount })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
