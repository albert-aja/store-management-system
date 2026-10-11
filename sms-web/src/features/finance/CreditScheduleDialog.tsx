import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { Receivable } from "./types";

interface CreditScheduleDialogProps {
  receivable: Receivable | null;
  onClose: () => void;
  onRecordPayment: (receivable: Receivable) => void;
}

export default function CreditScheduleDialog({
  receivable,
  onClose,
  onRecordPayment,
}: CreditScheduleDialogProps) {
  if (!receivable) return null;

  const progress =
    receivable.totalAmount > 0
      ? Math.min(
          100,
          Math.round((receivable.totalPaid / receivable.totalAmount) * 100),
        )
      : 0;

  return (
    <Dialog open={!!receivable} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Credit Account: {receivable.receivableNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Customer: {receivable.customerName} · Order: {receivable.salesOrderNumber}
            </Typography>
          </Box>
          <Chip
            label={receivable.status}
            color={
              receivable.status === "PAID_IN_FULL"
                ? "success"
                : receivable.status === "ACTIVE"
                  ? "primary"
                  : "default"
            }
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Financial Summary */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
              gap: 2,
              mb: 2,
            }}
          >
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Total Obligation
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                IDR {receivable.totalAmount.toLocaleString()}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Down Payment
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                IDR {receivable.downPaymentAmount.toLocaleString()}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Total Paid
              </Typography>
              <Typography variant="body1" color="success.main" sx={{ fontWeight: 600 }}>
                IDR {receivable.totalPaid.toLocaleString()}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Remaining Balance
              </Typography>
              <Typography
                variant="body1"
                color={receivable.remainingBalance > 0 ? "error.main" : "text.primary"}
                sx={{ fontWeight: 600 }}
              >
                IDR {receivable.remainingBalance.toLocaleString()}
              </Typography>
            </Paper>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ height: 8, borderRadius: 4 }}
                color={progress === 100 ? "success" : "primary"}
              />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {progress}% Paid
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Installment Schedule Table */}
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
          Installment Schedule ({receivable.installments.length} Months)
        </Typography>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell align="right">Amount Due</TableCell>
                <TableCell align="right">Amount Paid</TableCell>
                <TableCell align="right">Remaining</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell>Overdue Note</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {receivable.installments.map((inst) => {
                const remaining = inst.amountDue - inst.amountPaid;
                return (
                  <TableRow
                    key={inst.id}
                    sx={{
                      bgcolor:
                        inst.daysOverdue > 0 && inst.status !== "PAID"
                          ? "rgba(239, 68, 68, 0.04)"
                          : "inherit",
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>{inst.installmentNumber}</TableCell>
                    <TableCell>{new Date(inst.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      IDR {inst.amountDue.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      IDR {inst.amountPaid.toLocaleString()}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      IDR {remaining.toLocaleString()}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={inst.status}
                        color={
                          inst.status === "PAID"
                            ? "success"
                            : inst.status === "PARTIAL"
                              ? "warning"
                              : inst.daysOverdue > 0
                                ? "error"
                                : "default"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {inst.daysOverdue > 0 && inst.status !== "PAID" ? (
                        <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
                          ⚠ {inst.daysOverdue} days overdue
                        </Typography>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {receivable.status === "ACTIVE" && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              onClose();
              onRecordPayment(receivable);
            }}
          >
            Record Payment for Account
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
