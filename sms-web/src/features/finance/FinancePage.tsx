import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PaymentsIcon from "@mui/icons-material/Payments";
import HandshakeIcon from "@mui/icons-material/Handshake";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import PrintIcon from "@mui/icons-material/Print";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import TableChartIcon from "@mui/icons-material/TableChart";
import { IconButton, Tooltip } from "@mui/material";
import { exportToCsv } from "../../lib/exportCsv";
import { exportFinancialAgingToExcel, exportToExcel } from "../../lib/exportExcel";
import { useAuthStore } from "../../store/authStore";
import { useStores } from "../stores/hooks";
import CashCustodyActionDialog from "./CashCustodyActionDialog";
import CollectionAttemptDialog from "./CollectionAttemptDialog";
import CreditScheduleDialog from "./CreditScheduleDialog";
import RecordPaymentDialog from "./RecordPaymentDialog";
import {
  useCollectionAttempts,
  useCustomerPayments,
  usePaymentCustodies,
  useReceivables,
} from "./hooks";
import type { PaymentCustody, Receivable, ReceivableStatus } from "./types";

export default function FinancePage() {
  const canManage = useAuthStore(
    (s) =>
      s.hasPermission("FINANCE_MANAGE") ||
      s.hasRole("OWNER") ||
      s.hasRole("MANAGER"),
  );

  const { data: stores = [] } = useStores();

  const [currentTab, setCurrentTab] = useState(0);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReceivableStatus | "ALL">("ALL");

  // Dialog states
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(
    null,
  );
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentReceivableTarget, setPaymentReceivableTarget] =
    useState<Receivable | null>(null);

  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);
  const [selectedCustody, setSelectedCustody] = useState<PaymentCustody | null>(
    null,
  );
  const [custodyMode, setCustodyMode] = useState<"HANDOVER" | "VERIFY" | null>(
    null,
  );

  const { data: receivables = [], isLoading: isLoadingRec } = useReceivables({
    storeId: selectedStoreId || undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
  });

  const { data: payments = [], isLoading: isLoadingPay } = useCustomerPayments({
    storeId: selectedStoreId || undefined,
  });

  const { data: custodies = [], isLoading: isLoadingCustody } = usePaymentCustodies();

  const { data: collections = [], isLoading: isLoadingCol } =
    useCollectionAttempts({
      storeId: selectedStoreId || undefined,
    });

  // Calculate metrics
  const totalFinanced = receivables.reduce(
    (sum, r) => sum + r.financedAmount,
    0,
  );
  const totalCollected = receivables.reduce((sum, r) => sum + r.totalPaid, 0);
  const remainingOutstanding = receivables.reduce(
    (sum, r) => sum + r.remainingBalance,
    0,
  );
  const activeAccountsCount = receivables.filter(
    (r) => r.status === "ACTIVE",
  ).length;

  const handleExportExcel = () => {
    if (currentTab === 0) {
      const activeRecs = receivables.filter((r) => r.status !== "SETTLED_REPOSSESSION");
      let currentBal = 0;
      let pastDueBal = 0;
      let delinquentBal = 0;
      let defaultBal = 0;
      let currentCount = 0;
      let pastDueCount = 0;
      let delinquentCount = 0;
      let defaultCount = 0;

      const today = new Date();
      activeRecs.forEach((r) => {
        (r.installments || []).forEach((inst) => {
          if (inst.status === "PAID" || inst.status === "FORGIVEN") return;
          const bal = inst.amountDue - inst.amountPaid;
          if (bal <= 0) return;
          const dueDate = new Date(inst.dueDate);
          const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 0) {
            currentBal += bal;
            currentCount++;
          } else if (diffDays <= 30) {
            pastDueBal += bal;
            pastDueCount++;
          } else if (diffDays <= 60) {
            delinquentBal += bal;
            delinquentCount++;
          } else {
            defaultBal += bal;
            defaultCount++;
          }
        });
      });

      const totalBal = currentBal + pastDueBal + delinquentBal + defaultBal || remainingOutstanding;
      const storeObj = stores.find((s) => s.id === selectedStoreId);

      exportFinancialAgingToExcel({
        storeName: storeObj ? storeObj.name : "Company Wide (All Stores)",
        summary: {
          totalReceivableBalance: remainingOutstanding,
          totalOverdueBalance: pastDueBal + delinquentBal + defaultBal,
          totalCollectedCash: totalCollected,
          custodyDiscrepanciesCount: custodies.filter((c) => c.status === "DISCREPANCY").length,
        },
        buckets: [
          {
            bucketName: "Current (0-30 Days)",
            installmentCount: currentCount,
            totalAmount: currentBal,
            percentage: totalBal ? (currentBal / totalBal) * 100 : 0,
          },
          {
            bucketName: "Past Due (1-30 Days)",
            installmentCount: pastDueCount,
            totalAmount: pastDueBal,
            percentage: totalBal ? (pastDueBal / totalBal) * 100 : 0,
          },
          {
            bucketName: "Delinquent (31-60 Days)",
            installmentCount: delinquentCount,
            totalAmount: delinquentBal,
            percentage: totalBal ? (delinquentBal / totalBal) * 100 : 0,
          },
          {
            bucketName: "Default Risk (> 60 Days)",
            installmentCount: defaultCount,
            totalAmount: defaultBal,
            percentage: totalBal ? (defaultBal / totalBal) * 100 : 0,
          },
        ],
        receivables: receivables.map((r) => ({
          receivableNumber: r.receivableNumber,
          customerName: r.customerName,
          storeName: r.storeName,
          financedAmount: r.financedAmount,
          totalPaid: r.totalPaid,
          remainingBalance: r.remainingBalance,
          paymentTermMonths: r.paymentTermMonths,
          status: r.status,
          firstDueDate: r.firstDueDate,
        })),
      });
    } else {
      exportToExcel({
        filename: `customer_payments_${new Date().toISOString().substring(0, 10)}`,
        sheetName: "Customer Payments",
        title: "STORE MANAGEMENT SYSTEM — CUSTOMER PAYMENTS LEDGER",
        columns: [
          { key: "paymentNumber", label: "Payment Number", width: 22 },
          { key: "customerName", label: "Customer Name", width: 26 },
          { key: "paymentType", label: "Payment Type", width: 18 },
          { key: "paymentMethod", label: "Payment Method", width: 18 },
          { key: "amount", label: "Amount (IDR)", width: 20, format: (v) => Number(v ?? 0) },
          { key: "paidAt", label: "Transaction Date", width: 20 },
        ],
        data: payments,
      });
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Finance & Credit Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Receivables, Installment Schedules, Customer Payments, Cash Custody & Field Visits
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PaymentsIcon />}
            onClick={() => {
              setPaymentReceivableTarget(null);
              setPaymentDialogOpen(true);
            }}
          >
            Record Payment
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setCollectionDialogOpen(true)}
          >
            Log Field Visit
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={() => {
              if (currentTab === 0) {
                exportToCsv("receivables_aging", [
                  { key: "receivableNumber", label: "Contract #" },
                  { key: "customerName", label: "Customer" },
                  { key: "financedAmount", label: "Financed (IDR)" },
                  { key: "totalPaid", label: "Total Paid (IDR)" },
                  { key: "remainingBalance", label: "Remaining Balance (IDR)" },
                  { key: "status", label: "Status" },
                ], receivables);
              } else {
                exportToCsv("customer_payments", [
                  { key: "paymentNumber", label: "Payment #" },
                  { key: "customerName", label: "Customer" },
                  { key: "paymentType", label: "Type" },
                  { key: "paymentMethod", label: "Method" },
                  { key: "amount", label: "Amount (IDR)" },
                  { key: "paidAt", label: "Paid At" },
                ], payments);
              }
            }}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            color="success"
            startIcon={<TableChartIcon />}
            onClick={handleExportExcel}
          >
            Export Excel (.xlsx)
          </Button>
        </Box>
      </Box>

      {/* Top Metrics Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
          gap: 2.5,
          mb: 3,
        }}
      >
        <Card>
          <CardContent>
            <Typography variant="caption" color="text.secondary">
              Total Financed Volume
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
              IDR {totalFinanced.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Across all credit sales orders
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="caption" color="text.secondary">
              Total Cash Collected
            </Typography>
            <Typography variant="h6" color="success.main" sx={{ fontWeight: 700, mt: 0.5 }}>
              IDR {totalCollected.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Principal & Down Payments
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="caption" color="text.secondary">
              Outstanding Receivables
            </Typography>
            <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700, mt: 0.5 }}>
              IDR {remainingOutstanding.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Remaining Customer Obligations
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="caption" color="text.secondary">
              Active Credit Accounts
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
              {activeAccountsCount} Accounts
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Currently generating installments
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Global Filters */}
      <Paper sx={{ p: 2, mb: 3, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filter Store</InputLabel>
          <Select
            value={selectedStoreId}
            label="Filter Store"
            onChange={(e) => setSelectedStoreId(e.target.value)}
          >
            <MenuItem value="">All Stores</MenuItem>
            {stores.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name} ({s.code})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {currentTab === 0 && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Account Status</InputLabel>
            <Select
              value={statusFilter}
              label="Account Status"
              onChange={(e) => setStatusFilter(e.target.value as ReceivableStatus | "ALL")}
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="ACTIVE">Active (Unpaid/Due)</MenuItem>
              <MenuItem value="PAID_IN_FULL">Paid in Full</MenuItem>
              <MenuItem value="SETTLED_REPOSSESSION">Settled (Repossession)</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </Select>
          </FormControl>
        )}
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, val) => setCurrentTab(val)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label={`Receivables & Credit Accounts (${receivables.length})`} />
          <Tab label={`Payment Ledger (${payments.length})`} />
          <Tab label={`Cash Custody & Handover (${custodies.length})`} />
          <Tab label={`Field Collection Visits (${collections.length})`} />
        </Tabs>
      </Paper>

      {/* TAB 0: Receivables */}
      {currentTab === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Account Number</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Sales Order</TableCell>
                <TableCell align="right">Financed</TableCell>
                <TableCell align="right">Paid</TableCell>
                <TableCell align="right">Remaining</TableCell>
                <TableCell sx={{ minWidth: 140 }}>Progress</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoadingRec ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    Loading credit accounts...
                  </TableCell>
                </TableRow>
              ) : receivables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    No receivable accounts found.
                  </TableCell>
                </TableRow>
              ) : (
                receivables.map((r) => {
                  const progress =
                    r.totalAmount > 0
                      ? Math.min(100, Math.round((r.totalPaid / r.totalAmount) * 100))
                      : 0;
                  const handleExportExcel = () => {
                    if (currentTab === 0) {
                      const activeRecs = receivables.filter((r) => r.status !== "SETTLED_REPOSSESSION");
                      let currentBal = 0;
                      let pastDueBal = 0;
                      let delinquentBal = 0;
                      let defaultBal = 0;
                      let currentCount = 0;
                      let pastDueCount = 0;
                      let delinquentCount = 0;
                      let defaultCount = 0;

                      const today = new Date();
                      activeRecs.forEach((r) => {
                        (r.installments || []).forEach((inst) => {
                          if (inst.status === "PAID" || inst.status === "FORGIVEN") return;
                          const bal = inst.amountDue - inst.amountPaid;
                          if (bal <= 0) return;
                          const dueDate = new Date(inst.dueDate);
                          const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                          if (diffDays <= 0) {
                            currentBal += bal;
                            currentCount++;
                          } else if (diffDays <= 30) {
                            pastDueBal += bal;
                            pastDueCount++;
                          } else if (diffDays <= 60) {
                            delinquentBal += bal;
                            delinquentCount++;
                          } else {
                            defaultBal += bal;
                            defaultCount++;
                          }
                        });
                      });

                      const totalBal = currentBal + pastDueBal + delinquentBal + defaultBal || remainingOutstanding;
                      const storeObj = stores.find((s) => s.id === selectedStoreId);

                      exportFinancialAgingToExcel({
                        storeName: storeObj ? storeObj.name : "Company Wide (All Stores)",
                        summary: {
                          totalReceivableBalance: remainingOutstanding,
                          totalOverdueBalance: pastDueBal + delinquentBal + defaultBal,
                          totalCollectedCash: totalCollected,
                          custodyDiscrepanciesCount: custodies.filter((c) => c.status === "DISCREPANCY").length,
                        },
                        buckets: [
                          {
                            bucketName: "Current (0-30 Days)",
                            installmentCount: currentCount,
                            totalAmount: currentBal,
                            percentage: totalBal ? (currentBal / totalBal) * 100 : 0,
                          },
                          {
                            bucketName: "Past Due (1-30 Days)",
                            installmentCount: pastDueCount,
                            totalAmount: pastDueBal,
                            percentage: totalBal ? (pastDueBal / totalBal) * 100 : 0,
                          },
                          {
                            bucketName: "Delinquent (31-60 Days)",
                            installmentCount: delinquentCount,
                            totalAmount: delinquentBal,
                            percentage: totalBal ? (delinquentBal / totalBal) * 100 : 0,
                          },
                          {
                            bucketName: "Default Risk (> 60 Days)",
                            installmentCount: defaultCount,
                            totalAmount: defaultBal,
                            percentage: totalBal ? (defaultBal / totalBal) * 100 : 0,
                          },
                        ],
                        receivables: receivables.map((r) => ({
                          receivableNumber: r.receivableNumber,
                          customerName: r.customerName,
                          storeName: r.storeName,
                          financedAmount: r.financedAmount,
                          totalPaid: r.totalPaid,
                          remainingBalance: r.remainingBalance,
                          paymentTermMonths: r.paymentTermMonths,
                          status: r.status,
                          firstDueDate: r.firstDueDate,
                        })),
                      });
                    } else {
                      exportToExcel({
                        filename: `customer_payments_${new Date().toISOString().substring(0, 10)}`,
                        sheetName: "Customer Payments",
                        title: "STORE MANAGEMENT SYSTEM — CUSTOMER PAYMENTS LEDGER",
                        columns: [
                          { key: "paymentNumber", label: "Payment Number", width: 22 },
                          { key: "customerName", label: "Customer Name", width: 26 },
                          { key: "paymentType", label: "Payment Type", width: 18 },
                          { key: "paymentMethod", label: "Payment Method", width: 18 },
                          { key: "amount", label: "Amount (IDR)", width: 20, format: (v) => Number(v ?? 0) },
                          { key: "paidAt", label: "Transaction Date", width: 20 },
                        ],
                        data: payments,
                      });
                    }
                  };

                  return (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {r.receivableNumber}
                      </TableCell>
                      <TableCell>{r.customerName}</TableCell>
                      <TableCell>{r.salesOrderNumber}</TableCell>
                      <TableCell align="right">
                        IDR {r.financedAmount.toLocaleString()}
                      </TableCell>
                      <TableCell align="right" sx={{ color: "success.main", fontWeight: 600 }}>
                        IDR {r.totalPaid.toLocaleString()}
                      </TableCell>
                      <TableCell align="right" sx={{ color: r.remainingBalance > 0 ? "error.main" : "inherit" }}>
                        IDR {r.remainingBalance.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{ flex: 1, height: 6, borderRadius: 3 }}
                            color={progress === 100 ? "success" : "primary"}
                          />
                          <Typography variant="caption" sx={{ minWidth: 32 }}>
                            {progress}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={r.status}
                          color={
                            r.status === "PAID_IN_FULL"
                              ? "success"
                              : r.status === "ACTIVE"
                                ? "primary"
                                : "default"
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          onClick={() => setSelectedReceivable(r)}
                        >
                          Schedule
                        </Button>
                        {r.status === "ACTIVE" && (
                          <Button
                            size="small"
                            color="primary"
                            onClick={() => {
                              setPaymentReceivableTarget(r);
                              setPaymentDialogOpen(true);
                            }}
                          >
                            Pay
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* TAB 1: Payment Ledger */}
      {currentTab === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Payment Number</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Method</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Collector / Cashier</TableCell>
                <TableCell>Ref #</TableCell>
                <TableCell align="right">Allocations</TableCell>
                <TableCell align="center">Print</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoadingPay ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    Loading payment records...
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    No payments recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{p.paymentNumber}</TableCell>
                    <TableCell>{new Date(p.paidAt).toLocaleDateString()}</TableCell>
                    <TableCell>{p.customerName}</TableCell>
                    <TableCell>
                      <Chip size="small" label={p.paymentType} variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={p.paymentMethod}
                        color={p.paymentMethod === "CASH" ? "warning" : "info"}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: "success.main" }}>
                      IDR {p.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{p.collectedByName ?? "Direct / Store"}</TableCell>
                    <TableCell>{p.referenceNumber ?? "—"}</TableCell>
                    <TableCell align="right">
                      {p.allocations.length > 0 ? (
                        <Typography variant="caption" color="text.secondary">
                          {p.allocations.length} installments credited
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="primary.main">
                          Unallocated: IDR {p.unallocatedAmount.toLocaleString()}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Print Official Receipt">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() =>
                            window.open(`/api/documents/print/receipt/${p.id}`, "_blank")
                          }
                        >
                          <PrintIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* TAB 2: Cash Custody */}
      {currentTab === 2 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Payment Number</TableCell>
                <TableCell>Collected Date</TableCell>
                <TableCell>Current Holder (Staff)</TableCell>
                <TableCell>Handover Target</TableCell>
                <TableCell align="right">Expected Amount</TableCell>
                <TableCell align="right">Verified Amount</TableCell>
                <TableCell align="center">Custody Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoadingCustody ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    Loading cash custody records...
                  </TableCell>
                </TableRow>
              ) : custodies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    No cash custody records. All cash is settled or received via transfer.
                  </TableCell>
                </TableRow>
              ) : (
                custodies.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{c.paymentNumber}</TableCell>
                    <TableCell>{new Date(c.collectedAt).toLocaleDateString()}</TableCell>
                    <TableCell>{c.holderEmployeeName}</TableCell>
                    <TableCell>{c.handoverToEmployeeName ?? "—"}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      IDR {c.expectedAmount.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      {c.receivedAmount != null
                        ? `IDR ${c.receivedAmount.toLocaleString()}`
                        : "—"}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={c.status}
                        color={
                          c.status === "VERIFIED_BY_CASHIER"
                            ? "success"
                            : c.status === "HANDED_OVER"
                              ? "info"
                              : c.status === "DISCREPANCY"
                                ? "error"
                                : "warning"
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      {c.status === "HELD_BY_COLLECTOR" && (
                        <Button
                          size="small"
                          startIcon={<HandshakeIcon />}
                          onClick={() => {
                            setSelectedCustody(c);
                            setCustodyMode("HANDOVER");
                          }}
                        >
                          Hand Over
                        </Button>
                      )}
                      {(c.status === "HANDED_OVER" || c.status === "HELD_BY_COLLECTOR") &&
                        canManage && (
                          <Button
                            size="small"
                            color="success"
                            startIcon={<AssignmentTurnedInIcon />}
                            onClick={() => {
                              setSelectedCustody(c);
                              setCustodyMode("VERIFY");
                            }}
                          >
                            Verify
                          </Button>
                        )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* TAB 3: Field Collection Visits */}
      {currentTab === 3 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Visit Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Visiting Collector</TableCell>
                <TableCell>Account</TableCell>
                <TableCell align="center">Outcome</TableCell>
                <TableCell>Promised Follow-up Date</TableCell>
                <TableCell>Address Visited</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoadingCol ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    Loading visit logs...
                  </TableCell>
                </TableRow>
              ) : collections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    No collection visits recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                collections.map((col) => (
                  <TableRow key={col.id} hover>
                    <TableCell>{new Date(col.visitDate).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{col.customerName}</TableCell>
                    <TableCell>{col.assignedEmployeeName}</TableCell>
                    <TableCell>{col.receivableNumber ?? "—"}</TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={col.outcome}
                        color={
                          col.outcome === "PAID"
                            ? "success"
                            : col.outcome === "PROMISED_TO_PAY"
                              ? "warning"
                              : col.outcome === "REFUSED"
                                ? "error"
                                : "default"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {col.promisedPaymentDate ? (
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "warning.main" }}>
                          {new Date(col.promisedPaymentDate).toLocaleDateString()}
                        </Typography>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{col.customerAddressVisited ?? "—"}</TableCell>
                    <TableCell>{col.notes ?? "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Schedule Detail Dialog */}
      <CreditScheduleDialog
        receivable={selectedReceivable}
        onClose={() => setSelectedReceivable(null)}
        onRecordPayment={(r) => {
          setPaymentReceivableTarget(r);
          setPaymentDialogOpen(true);
        }}
      />

      {/* Record Payment Dialog */}
      <RecordPaymentDialog
        open={paymentDialogOpen}
        preselectedReceivable={paymentReceivableTarget}
        onClose={() => {
          setPaymentDialogOpen(false);
          setPaymentReceivableTarget(null);
        }}
      />

      {/* Cash Custody Action Dialog */}
      <CashCustodyActionDialog
        custody={selectedCustody}
        mode={custodyMode}
        onClose={() => {
          setSelectedCustody(null);
          setCustodyMode(null);
        }}
      />

      {/* Field Collection Visit Dialog */}
      <CollectionAttemptDialog
        open={collectionDialogOpen}
        onClose={() => setCollectionDialogOpen(false)}
      />
    </Container>
  );
}
