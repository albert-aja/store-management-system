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
        enqueueSnackbar("Please select the employee receiving cash", {
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
        enqueueSnackbar("Cash handover recorded", { variant: "success" });
        onClose();
      } catch {
        enqueueSnackbar("Failed to record cash handover", { variant: "error" });
      }
    } else if (mode === "VERIFY") {
      if (isNaN(parsedReceived) || parsedReceived < 0) {
        enqueueSnackbar("Please enter a valid received amount", {
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
        enqueueSnackbar("Cash custody verified by cashier", {
          variant: "success",
        });
        onClose();
      } catch {
        enqueueSnackbar("Failed to verify cash custody", { variant: "error" });
      }
    }
  };

  const activeEmployees = employees.filter((e) => e.employmentStatus === "ACTIVE");

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === "HANDOVER"
          ? "Hand Over Cash to Cashier / Admin"
          : "Cashier Verification & Intake"}
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
        <Box sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Payment: {custody.paymentNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Expected Cash: IDR {custody.expectedAmount.toLocaleString()} · Current Holder:{" "}
            {custody.holderEmployeeName}
          </Typography>
        </Box>

        {mode === "HANDOVER" && (
          <>
            <FormControl fullWidth size="small">
              <InputLabel>Hand Over To (Cashier / Store Admin)</InputLabel>
              <Select
                value={handoverToEmployeeId}
                label="Hand Over To (Cashier / Store Admin)"
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
              label="Handover Notes"
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
              label="Physical Cash Received (IDR)"
              type="number"
              size="small"
              fullWidth
              value={receivedAmount}
              onChange={(e) => setReceivedAmount(e.target.value)}
              required
            />

            {diff !== 0 && (
              <Alert severity="warning">
                Discrepancy detected: IDR {Math.abs(diff).toLocaleString()}{" "}
                {diff > 0 ? "SHORT (missing cash)" : "OVER (excess cash)"}. This will be
                permanently recorded for audit.
              </Alert>
            )}

            {diff === 0 && (
              <Alert severity="success">
                Exact match: IDR {custody.expectedAmount.toLocaleString()} verified.
              </Alert>
            )}

            <TextField
              label="Discrepancy / Audit Notes"
              size="small"
              fullWidth
              multiline
              rows={2}
              value={discrepancyNotes}
              onChange={(e) => setDiscrepancyNotes(e.target.value)}
              placeholder="Explain any physical count differences..."
            />
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={handoverMutation.isPending || verifyMutation.isPending}
        >
          {mode === "HANDOVER" ? "Confirm Handover" : "Verify & Complete Intake"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
