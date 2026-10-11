import { useState } from "react";
import {
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
} from "@mui/material";
import { useSnackbar } from "notistack";
import type { Customer } from "../customers/types";
import { useCustomers } from "../customers/hooks";
import { useEmployees } from "../employees/hooks";
import { useStores } from "../stores/hooks";
import { useRecordCollectionAttempt } from "./hooks";
import type { CollectionOutcome, Receivable } from "./types";

interface CollectionAttemptDialogProps {
  open: boolean;
  preselectedReceivable?: Receivable | null;
  onClose: () => void;
}

export default function CollectionAttemptDialog({
  open,
  preselectedReceivable,
  onClose,
}: CollectionAttemptDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const { data: stores = [] } = useStores();
  const { data: customers = [] } = useCustomers();
  const { data: employees = [] } = useEmployees();

  const recordAttempt = useRecordCollectionAttempt();

  const [storeId, setStoreId] = useState(
    preselectedReceivable?.storeId ?? stores[0]?.id ?? "",
  );
  const [customerId, setCustomerId] = useState(
    preselectedReceivable?.customerId ?? "",
  );
  const [assignedEmployeeId, setAssignedEmployeeId] = useState("");
  const [visitDate, setVisitDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [outcome, setOutcome] = useState<CollectionOutcome>("PAID");
  const [promisedPaymentDate, setPromisedPaymentDate] = useState("");
  const [customerAddressVisited, setCustomerAddressVisited] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!storeId || !customerId || !assignedEmployeeId || !visitDate) {
      enqueueSnackbar("Please fill required fields (store, customer, collector, date)", {
        variant: "warning",
      });
      return;
    }

    try {
      await recordAttempt.mutateAsync({
        storeId,
        customerId,
        receivableId: preselectedReceivable?.id,
        assignedEmployeeId,
        visitDate,
        outcome,
        promisedPaymentDate: promisedPaymentDate || undefined,
        customerAddressVisited: customerAddressVisited || undefined,
        notes: notes || undefined,
      });
      enqueueSnackbar("Collection visit record logged", { variant: "success" });
      onClose();
    } catch {
      enqueueSnackbar("Failed to log collection visit", { variant: "error" });
    }
  };

  const activeEmployees = employees.filter((e) => e.employmentStatus === "ACTIVE");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Log Operational Collection Visit / Attempt</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
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

        <FormControl fullWidth size="small">
          <InputLabel>Visiting Collector / Staff</InputLabel>
          <Select
            value={assignedEmployeeId}
            label="Visiting Collector / Staff"
            onChange={(e) => setAssignedEmployeeId(e.target.value)}
          >
            {activeEmployees.map((e) => (
              <MenuItem key={e.id} value={e.id}>
                {e.fullName} ({(e.roleCodes ?? []).join(", ")})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Visit Date"
          type="date"
          size="small"
          fullWidth
          value={visitDate}
          onChange={(e) => setVisitDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          required
        />

        <FormControl fullWidth size="small">
          <InputLabel>Visit Outcome</InputLabel>
          <Select
            value={outcome}
            label="Visit Outcome"
            onChange={(e) => setOutcome(e.target.value as CollectionOutcome)}
          >
            <MenuItem value="PAID">Paid in Full</MenuItem>
            <MenuItem value="PARTIAL_PAID">Partial Payment</MenuItem>
            <MenuItem value="PROMISED_TO_PAY">Promised to Pay (Schedule Follow-up)</MenuItem>
            <MenuItem value="CUSTOMER_UNAVAILABLE">Customer Unavailable / Not Home</MenuItem>
            <MenuItem value="REFUSED">Refused to Pay</MenuItem>
            <MenuItem value="RESCHEDULED">Rescheduled Visit</MenuItem>
          </Select>
        </FormControl>

        {outcome === "PROMISED_TO_PAY" && (
          <TextField
            label="Promised Payment Date (Original Due Date Unchanged)"
            type="date"
            size="small"
            fullWidth
            value={promisedPaymentDate}
            onChange={(e) => setPromisedPaymentDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            helperText="Note: Recording a promised date does NOT postpone or shift the legal contract due dates (README 12.3)."
          />
        )}

        <TextField
          label="Customer Address Visited"
          size="small"
          fullWidth
          value={customerAddressVisited}
          onChange={(e) => setCustomerAddressVisited(e.target.value)}
        />

        <TextField
          label="Field Observations / Notes"
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
          disabled={recordAttempt.isPending}
        >
          {recordAttempt.isPending ? "Logging..." : "Save Visit Record"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
