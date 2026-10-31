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
import { t } from "../../lib/locale";

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
      enqueueSnackbar(t("Please fill required fields (store, customer, collector, date)"), {
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
      enqueueSnackbar(t("Collection visit record logged"), { variant: "success" });
      onClose();
    } catch {
      enqueueSnackbar(t("Failed to log collection visit"), { variant: "error" });
    }
  };

  const activeEmployees = employees.filter((e) => e.employmentStatus === "ACTIVE");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("Log Operational Collection Visit / Attempt")}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel>{t("Store")}</InputLabel>
          <Select
            value={storeId}
            label={t("Store")}
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
          <InputLabel>{t("Customer")}</InputLabel>
          <Select
            value={customerId}
            label={t("Customer")}
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
          <InputLabel>{t("Visiting Collector / Staff")}</InputLabel>
          <Select
            value={assignedEmployeeId}
            label={t("Visiting Collector / Staff")}
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
          label={t("Visit Date")}
          type="date"
          size="small"
          fullWidth
          value={visitDate}
          onChange={(e) => setVisitDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          required
        />

        <FormControl fullWidth size="small">
          <InputLabel>{t("Visit Outcome")}</InputLabel>
          <Select
            value={outcome}
            label={t("Visit Outcome")}
            onChange={(e) => setOutcome(e.target.value as CollectionOutcome)}
          >
            <MenuItem value="PAID">{t("Paid in Full")}</MenuItem>
            <MenuItem value="PARTIAL_PAID">{t("Partial Payment")}</MenuItem>
            <MenuItem value="PROMISED_TO_PAY">{t("Promised to Pay (Schedule Follow-up)")}</MenuItem>
            <MenuItem value="CUSTOMER_UNAVAILABLE">{t("Customer Unavailable / Not Home")}</MenuItem>
            <MenuItem value="REFUSED">{t("Refused to Pay")}</MenuItem>
            <MenuItem value="RESCHEDULED">{t("Rescheduled Visit")}</MenuItem>
          </Select>
        </FormControl>

        {outcome === "PROMISED_TO_PAY" && (
          <TextField
            label={t("Promised Payment Date (Original Due Date Unchanged)")}
            type="date"
            size="small"
            fullWidth
            value={promisedPaymentDate}
            onChange={(e) => setPromisedPaymentDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            helperText={t("Note: Recording a promised date does NOT postpone or shift the legal contract due dates (README 12.3).")}
          />
        )}

        <TextField
          label={t("Customer Address Visited")}
          size="small"
          fullWidth
          value={customerAddressVisited}
          onChange={(e) => setCustomerAddressVisited(e.target.value)}
        />

        <TextField
          label={t("Field Observations / Notes")}
          size="small"
          fullWidth
          multiline
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>{t("Cancel")}</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={recordAttempt.isPending}
        >
          {recordAttempt.isPending ? t("Logging...") : t("Save Visit Record")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
