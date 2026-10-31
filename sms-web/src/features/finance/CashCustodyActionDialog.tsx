import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useEmployees } from "../employees/hooks";
import { useHandoverCash, useVerifyCash } from "./hooks";
import type { PaymentCustody } from "./types";
import { t , formatNumber} from "../../lib/locale";

interface CashCustodyActionDialogProps {
  custody: PaymentCustody | null;
  mode: "HANDOVER" | "VERIFY" | null;
  onClose: () => void;
}

export default function CashCustodyActionDialog({
  custody,
  mode,
  onClose,
}: CashCustodyActionDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const { data: employees = [] } = useEmployees();

  const handoverMutation = useHandoverCash();
  const verifyMutation = useVerifyCash();

  const [handoverToEmployeeId, setHandoverToEmployeeId] = useState("");
  const [receivedAmount, setReceivedAmount] = useState(
    custody ? String(custody.expectedAmount) : "",
  );
  const [discrepancyNotes, setDiscrepancyNotes] = useState("");
  const [notes, setNotes] = useState("");

  if (!custody || !mode) return null;

  const parsedReceived = Number(receivedAmount);
  const diff = !isNaN(parsedReceived) ? custody.expectedAmount - parsedReceived : 0;

  const handleSubmit = async () => {
    if (mode === "HANDOVER") {
      if (!handoverToEmployeeId) {
        enqueueSnackbar(t("Please select the employee receiving cash"), {
          variant: "warning",
        });
        return;
      }
      try {
        await handoverMutation.mutateAsync({
          id: custody.id,
          input: {
            handoverToEmployeeId,
            notes: notes || undefined,
          },
        });
        enqueueSnackbar(t("Cash handover recorded"), { variant: "success" });
        onClose();
      } catch {
        enqueueSnackbar(t("Failed to record cash handover"), { variant: "error" });
      }
    } else if (mode === "VERIFY") {
      if (isNaN(parsedReceived) || parsedReceived < 0) {
        enqueueSnackbar(t("Please enter a valid received amount"), {
          variant: "warning",
        });
        return;
      }
      try {
        await verifyMutation.mutateAsync({
          id: custody.id,
          input: {
            receivedAmount: parsedReceived,
            discrepancyNotes: discrepancyNotes || undefined,
          },
        });
        enqueueSnackbar(t("Cash custody verified by cashier"), {
          variant: "success",
        });
        onClose();
      } catch {
        enqueueSnackbar(t("Failed to verify cash custody"), { variant: "error" });
      }
    }
  };

  const activeEmployees = employees.filter((e) => e.employmentStatus === "ACTIVE");

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === "HANDOVER"
          ? t("Hand Over Cash to Cashier / Admin")
          : t("Cashier Verification & Intake")}
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
        <Box sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {t("Payment:")} {custody.paymentNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("Expected Cash: IDR")} {formatNumber(custody.expectedAmount)} {t("· Current Holder:")}{" "}
            {custody.holderEmployeeName}
          </Typography>
        </Box>

        {mode === "HANDOVER" && (
          <>
            <FormControl fullWidth size="small">
              <InputLabel>{t("Hand Over To (Cashier / Store Admin)")}</InputLabel>
              <Select
                value={handoverToEmployeeId}
                label={t("Hand Over To (Cashier / Store Admin)")}
                onChange={(e) => setHandoverToEmployeeId(e.target.value)}
              >
                {activeEmployees.map((e) => (
                  <MenuItem key={e.id} value={e.id}>
                    {e.fullName} ({(e.roleCodes ?? []).join(", ")})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label={t("Handover Notes")}
              size="small"
              fullWidth
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </>
        )}

        {mode === "VERIFY" && (
          <>
            <TextField
              label={t("Physical Cash Received (IDR)")}
              type="number"
              size="small"
              fullWidth
              value={receivedAmount}
              onChange={(e) => setReceivedAmount(e.target.value)}
              required
            />

            {diff !== 0 && (
              <Alert severity="warning">
                {t("Discrepancy detected: IDR")} {formatNumber(Math.abs(diff))}{" "}
                {diff > 0 ? t("SHORT (missing cash)") : t("OVER (excess cash)")}
                {t(". This will be permanently recorded for audit.")}</Alert>
            )}

            {diff === 0 && (
              <Alert severity="success">
                {t("Exact match: IDR")} {formatNumber(custody.expectedAmount)} {t("verified.")}
              </Alert>
            )}

            <TextField
              label={t("Discrepancy / Audit Notes")}
              size="small"
              fullWidth
              multiline
              rows={2}
              value={discrepancyNotes}
              onChange={(e) => setDiscrepancyNotes(e.target.value)}
              placeholder={t("Explain any physical count differences...")}
            />
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>{t("Cancel")}</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={handoverMutation.isPending || verifyMutation.isPending}
        >
          {mode === "HANDOVER" ? t("Confirm Handover") : t("Verify & Complete Intake")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
