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
import { t , formatDate, formatNumber} from "../../lib/locale";

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
      enqueueSnackbar(t("Please select store, customer and a valid positive amount"), {
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
      enqueueSnackbar(t("Customer payment recorded successfully"), {
        variant: "success",
      });
      onClose();
    } catch {
      enqueueSnackbar(t("Failed to record payment"), { variant: "error" });
    }
  };

  const activeEmployees = employees.filter((e) => e.employmentStatus === "ACTIVE");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("Record Customer Payment")}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
        {preselectedReceivable && (
          <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600 }}>
            {t("Applying payment to Account:")} {preselectedReceivable.receivableNumber} (
            {preselectedReceivable.customerName})
          </Typography>
        )}

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

        <TextField
          label={t("Amount Received (IDR)")}
          type="number"
          size="small"
          fullWidth
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <FormControl size="small">
            <InputLabel>{t("Payment Type")}</InputLabel>
            <Select
              value={paymentType}
              label={t("Payment Type")}
              onChange={(e) => setPaymentType(e.target.value as PaymentType)}
            >
              <MenuItem value="INSTALLMENT">{t("Installment")}</MenuItem>
              <MenuItem value="DOWN_PAYMENT">{t("Down Payment")}</MenuItem>
              <MenuItem value="CASH_SALES">{t("Cash Sales")}</MenuItem>
              <MenuItem value="COD">{t("Cash on Delivery (COD)")}</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>{t("Payment Method")}</InputLabel>
            <Select
              value={paymentMethod}
              label={t("Payment Method")}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              <MenuItem value="CASH">{t("Cash")}</MenuItem>
              <MenuItem value="BANK_TRANSFER">{t("Bank Transfer")}</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {paymentMethod === "CASH" && (
          <FormControl fullWidth size="small">
            <InputLabel>{t("Collected By (Field Staff / Cashier)")}</InputLabel>
            <Select
              value={collectedById}
              label={t("Collected By (Field Staff / Cashier)")}
              onChange={(e) => setCollectedById(e.target.value)}
            >
              <MenuItem value="">{t("None / Directly Received")}</MenuItem>
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
            <InputLabel>{t("Target Specific Installment (Optional)")}</InputLabel>
            <Select
              value={specificInstallmentId}
              label={t("Target Specific Installment (Optional)")}
              onChange={(e) => setSpecificInstallmentId(e.target.value)}
            >
              <MenuItem value="">{t("Auto-allocate (Oldest Outstanding First)")}</MenuItem>
              {preselectedReceivable.installments
                .filter((i) => i.status !== "PAID")
                .map((i) => (
                  <MenuItem key={i.id} value={i.id}>
                    {t("Installment #")}{i.installmentNumber} {t("(Due:")}{" "}
                    {formatDate(new Date(i.dueDate), undefined, { dateStyle: "medium" })} {t("- Remaining: IDR")}{" "}
                    {formatNumber((i.amountDue - i.amountPaid))})
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        )}

        <TextField
          label={t("Reference Number (Bank Transfer / Receipt #)")}
          size="small"
          fullWidth
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
        />

        <TextField
          label={t("Notes / Description")}
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
          disabled={recordPayment.isPending}
        >
          {recordPayment.isPending ? t("Recording...") : t("Save Payment")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
