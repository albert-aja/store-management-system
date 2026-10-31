import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";
import AddCardIcon from "@mui/icons-material/AddCard";
import PaymentsIcon from "@mui/icons-material/Payments";
import { useSnackbar } from "notistack";
import CreditScheduleDialog from "./CreditScheduleDialog";
import RecordPaymentDialog from "./RecordPaymentDialog";
import {
  useCreateReceivable,
  useReceivablesBySalesOrder,
} from "./hooks";
import type { Receivable } from "./types";
import { formatNumber , localizeDisplayCode, t} from "../../lib/locale";

interface ReceivableSalesOrderPanelProps {
  salesOrderId: string;
  isConfirmedOrReleased: boolean;
}

export default function ReceivableSalesOrderPanel({
  salesOrderId,
  isConfirmedOrReleased,
}: ReceivableSalesOrderPanelProps) {
  const { enqueueSnackbar } = useSnackbar();
  const { data: receivables = [], isLoading } =
    useReceivablesBySalesOrder(salesOrderId);
  const createReceivable = useCreateReceivable();

  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(
    null,
  );
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [targetReceivable, setTargetReceivable] = useState<Receivable | null>(
    null,
  );

  const handleCreateReceivable = async () => {
    try {
      await createReceivable.mutateAsync({
        salesOrderId,
      });
      enqueueSnackbar(t("Credit schedule (receivable) generated successfully"), {
        variant: "success",
      });
    } catch {
      enqueueSnackbar(t("Failed to create credit schedule"), { variant: "error" });
    }
  };

  if (!isConfirmedOrReleased) return null;

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1.5,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {t("Credit Accounts & Receivables (")}{receivables.length})
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t("Payment schedules and customer obligation tracking")}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          {receivables.length === 0 && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddCardIcon />}
              onClick={handleCreateReceivable}
              disabled={createReceivable.isPending}
            >
              {t("Generate Credit Schedule")}
            </Button>
          )}
          {receivables.length > 0 && (
            <Button
              variant="contained"
              size="small"
              startIcon={<PaymentsIcon />}
              onClick={() => {
                setTargetReceivable(receivables[0]);
                setPaymentDialogOpen(true);
              }}
            >
              {t("Record Payment")}
            </Button>
          )}
        </Box>
      </Box>

      {isLoading ? (
        <Typography variant="body2" color="text.secondary">
          {t("Loading receivables...")}
        </Typography>
      ) : receivables.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t("No credit receivable generated yet. Click \"Generate Credit Schedule\" to create the installment schedule from agreed payment terms.")}</Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {receivables.map((r) => {
            const progress =
              r.totalAmount > 0
                ? Math.min(100, Math.round((r.totalPaid / r.totalAmount) * 100))
                : 0;
            return (
              <Paper
                key={r.id}
                variant="outlined"
                sx={{
                  p: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 2,
                }}
              >
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {r.receivableNumber}
                    </Typography>
                    <Chip
                      size="small"
                      label={localizeDisplayCode(r.status)}
                      color={
                        r.status === "PAID_IN_FULL"
                          ? "success"
                          : r.status === "ACTIVE"
                            ? "primary"
                            : "default"
                      }
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {t("Total: IDR")} {formatNumber(r.totalAmount)} {t("· Financed: IDR")}{" "}
                    {formatNumber(r.financedAmount)} ({r.paymentTermMonths} {t("Months)")}
                  </Typography>
                </Box>

                <Box sx={{ minWidth: 160 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="caption">
                      {t("Paid: IDR")} {formatNumber(r.totalPaid)}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {progress}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ height: 6, borderRadius: 3 }}
                    color={progress === 100 ? "success" : "primary"}
                  />
                  <Typography
                    variant="caption"
                    color={r.remainingBalance > 0 ? "error.main" : "text.secondary"}
                    sx={{ display: "block", mt: 0.5 }}
                  >
                    {t("Remaining: IDR")} {formatNumber(r.remainingBalance)}
                  </Typography>
                </Box>

                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setSelectedReceivable(r)}
                >
                  {t("View Schedule (")}{r.installments.length})
                </Button>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* Schedule Detail Dialog */}
      <CreditScheduleDialog
        receivable={selectedReceivable}
        onClose={() => setSelectedReceivable(null)}
        onRecordPayment={(r) => {
          setTargetReceivable(r);
          setPaymentDialogOpen(true);
        }}
      />

      {/* Record Payment Dialog */}
      <RecordPaymentDialog
        open={paymentDialogOpen}
        preselectedReceivable={targetReceivable}
        onClose={() => {
          setPaymentDialogOpen(false);
          setTargetReceivable(null);
        }}
      />
    </Paper>
  );
}
