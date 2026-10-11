import { useState } from "react";
import {
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
import type { Customer } from "../customers/types";
import { useCustomers } from "../customers/hooks";
import { useEmployees } from "../employees/hooks";
import { useStores } from "../stores/hooks";
import { useRecordCustomerPayment } from "./hooks";
import type { PaymentMethod, PaymentType, Receivable } from "./types";

interface RecordPaymentDialogProps {
  open: boolean;
  preselectedReceivable?: Receivable | null;
  onClose: () => void;
}

export default function RecordPaymentDialog({
  open,
  preselectedReceivable,
  onClose,
}: RecordPaymentDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const { data: stores = [] } = useStores();
  const { data: customers = [] } = useCustomers();
  const { data: employees = [] } = useEmployees();

  const recordPayment = useRecordCustomerPayment();

  const [storeId, setStoreId] = useState(
    preselectedReceivable?.storeId ?? stores[0]?.id ?? "",
  );
  const [customerId, setCustomerId] = useState(
    preselectedReceivable?.customerId ?? "",
  );
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("INSTALLMENT");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [collectedById, setCollectedById] = useState("");
  const [specificInstallmentId, setSpecificInstallmentId] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    const parsedAmount = Number(amount);
    if (!storeId || !customerId || isNaN(parsedAmount) || parsedAmount <= 0) {
      enqueueSnackbar("Please select store, customer and a valid positive amount", {
        variant: "warning",
      });
      return;
    }

    try {
      await recordPayment.mutateAsync({
        storeId,
        customerId,
        salesOrderId: preselectedReceivable?.salesOrderId,
        amount: parsedAmount,
        paymentType,
        paymentMethod,
        referenceNumber: referenceNumber || undefined,
        collectedById: collectedById || undefined,
        specificInstallmentId: specificInstallmentId || undefined,
        notes: notes || undefined,
      });
      enqueueSnackbar("Customer payment recorded successfully", {
        variant: "success",
      });
      onClose();
    } catch {
      enqueueSnackbar("Failed to record payment", { variant: "error" });
    }
  };

  const activeEmployees = employees.filter((e) => e.employmentStatus === "ACTIVE");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Record Customer Payment</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
        {preselectedReceivable && (
          <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600 }}>
            Applying payment to Account: {preselectedReceivable.receivableNumber} (
            {preselectedReceivable.customerName})
          </Typography>
        )}

        <FormControl fullWidth size="small">
          <InputLabel>Store</InputLabel>
          <Select
            value={storeId}
            label="Store"
            onChange={(e) => setStoreId(e.target.value)}
          >
            {stores.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name} ({s.code})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Customer</InputLabel>
          <Select
            value={customerId}
            label="Customer"
            onChange={(e) => setCustomerId(e.target.value)}
          >
            {customers.map((c: Customer) => (
              <MenuItem key={c.id} value={c.id}>
                {c.fullName} ({c.nik})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Amount Received (IDR)"
          type="number"
          size="small"
          fullWidth
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <FormControl size="small">
            <InputLabel>Payment Type</InputLabel>
            <Select
              value={paymentType}
              label="Payment Type"
              onChange={(e) => setPaymentType(e.target.value as PaymentType)}
            >
              <MenuItem value="INSTALLMENT">Installment</MenuItem>
              <MenuItem value="DOWN_PAYMENT">Down Payment</MenuItem>
              <MenuItem value="CASH_SALES">Cash Sales</MenuItem>
              <MenuItem value="COD">Cash on Delivery (COD)</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={paymentMethod}
              label="Payment Method"
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              <MenuItem value="CASH">Cash</MenuItem>
              <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {paymentMethod === "CASH" && (
          <FormControl fullWidth size="small">
            <InputLabel>Collected By (Field Staff / Cashier)</InputLabel>
            <Select
              value={collectedById}
              label="Collected By (Field Staff / Cashier)"
              onChange={(e) => setCollectedById(e.target.value)}
            >
              <MenuItem value="">None / Directly Received</MenuItem>
              {activeEmployees.map((e) => (
                <MenuItem key={e.id} value={e.id}>
                  {e.fullName} ({(e.roleCodes ?? []).join(", ")})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {preselectedReceivable && (
          <FormControl fullWidth size="small">
            <InputLabel>Target Specific Installment (Optional)</InputLabel>
            <Select
              value={specificInstallmentId}
              label="Target Specific Installment (Optional)"
              onChange={(e) => setSpecificInstallmentId(e.target.value)}
            >
              <MenuItem value="">Auto-allocate (Oldest Outstanding First)</MenuItem>
              {preselectedReceivable.installments
                .filter((i) => i.status !== "PAID")
                .map((i) => (
                  <MenuItem key={i.id} value={i.id}>
                    Installment #{i.installmentNumber} (Due:{" "}
                    {new Date(i.dueDate).toLocaleDateString()} - Remaining: IDR{" "}
                    {(i.amountDue - i.amountPaid).toLocaleString()})
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        )}

        <TextField
          label="Reference Number (Bank Transfer / Receipt #)"
          size="small"
          fullWidth
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
        />

        <TextField
          label="Notes / Description"
          size="small"
          fullWidth
          multiline
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={recordPayment.isPending}
        >
          {recordPayment.isPending ? "Recording..." : "Save Payment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
