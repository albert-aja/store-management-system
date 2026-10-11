import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import {
  useRecordSupplierPayment,
  useSupplierPayments,
  useTotalPaid,
} from "./hooks";

interface SupplierPaymentPanelProps {
  purchaseOrderId: string;
  poCancelled: boolean;
  poTotal?: number;
}

export default function SupplierPaymentPanel({
  purchaseOrderId,
  poCancelled,
  poTotal,
}: SupplierPaymentPanelProps) {
  const { enqueueSnackbar } = useSnackbar();
  const { data: payments = [] } = useSupplierPayments(purchaseOrderId);
  const { data: totalPaid = 0 } = useTotalPaid(purchaseOrderId);
  const recordPayment = useRecordSupplierPayment(purchaseOrderId);

  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const handleRecord = () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      enqueueSnackbar("Enter a valid positive amount", { variant: "warning" });
      return;
    }
    recordPayment.mutate(
      { purchaseOrderId, amount: parsed, notes: notes || undefined },
      {
        onSuccess: () => {
          enqueueSnackbar("Payment recorded", { variant: "success" });
          setAmount("");
          setNotes("");
        },
        onError: () =>
          enqueueSnackbar("Failed to record payment — PO may be cancelled", {
            variant: "error",
          }),
      },
    );
  };

  const numericPaid = Number(totalPaid);
  const remaining = poTotal !== undefined ? Math.max(0, poTotal - numericPaid) : 0;
  const isPaidInFull = poTotal !== undefined && poTotal > 0 && numericPaid >= poTotal;

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 1 }}>
        <Typography variant="subtitle1">
          Supplier Payments — Total paid: <strong>{numericPaid.toLocaleString()}</strong>
          {poTotal !== undefined && poTotal > 0 && (
            <> / Total PO: <strong>{poTotal.toLocaleString()}</strong></>
          )}
        </Typography>
        {isPaidInFull && (
          <Chip label="PAID IN FULL" size="small" color="success" />
        )}
        {poTotal !== undefined && poTotal > 0 && !isPaidInFull && (
          <Typography variant="body2" color="text.secondary">
            (Remaining: {remaining.toLocaleString()})
          </Typography>
        )}
      </Box>

      <List dense>
        {payments.map((p) => (
          <ListItem key={p.id}>
            <ListItemText
              primary={`${Number(p.amount).toLocaleString()} on ${new Date(p.paidAt).toLocaleDateString()}`}
              secondary={p.notes ?? undefined}
            />
          </ListItem>
        ))}
        {payments.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No payments recorded yet.
          </Typography>
        )}
      </List>

      {!poCancelled && (
        <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
          <TextField
            id="supplier-payment-amount"
            label="Amount"
            type="number"
            size="small"
            sx={{ width: 160 }}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
          />
          <TextField
            id="supplier-payment-notes"
            label="Notes (optional)"
            size="small"
            sx={{ width: 240 }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button
            id="btn-record-supplier-payment"
            variant="contained"
            size="small"
            onClick={handleRecord}
          >
            Record Payment
          </Button>
        </Box>
      )}
    </Paper>
  );
}
