import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PieChartIcon from '@mui/icons-material/PieChart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CategoryIcon from '@mui/icons-material/Category';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useAuthStore } from '../../store/authStore';
import { useStores } from '../stores/hooks';
import {
  useExpenseCategories,
  useBudgetRequests,
  useExpenses,
  useBudgetConsumption,
  useCreateExpense,
  useApproveExpense,
  usePayExpense,
  useCreateBudgetRequest,
  useApproveBudgetRequest,
} from './hooks';
import type {
  Expense,
  ExpenseCategory,
  BudgetRequest,
  BudgetConsumption,
  ExpensePaymentMethod,
  ExpenseActivityType,
} from './types';
import { formatDate, formatNumber, localizeDisplayCode, t } from "../../lib/locale";

export default function ExpenseBudgetPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [storeFilter, setStoreFilter] = useState('');
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const { data: stores = [] } = useStores();
  const selectedStoreId = storeFilter || (stores[0]?.id ?? '');

  const currentEmployee = useAuthStore((s) => s.employee);
  const canManage = useAuthStore(
    (s) =>
      s.hasPermission('EXPENSE_MANAGE') ||
      s.hasRole('OWNER') ||
      s.hasRole('MANAGER')
  );

  // Queries
  const { data: categories = [] as ExpenseCategory[] } = useExpenseCategories();
  const { data: expenses = [] as Expense[], isLoading: loadingExpenses } = useExpenses(
    selectedStoreId || undefined
  );
  const { data: budgetRequests = [] as BudgetRequest[], isLoading: loadingBudgets } = useBudgetRequests(
    selectedStoreId || undefined,
    selectedYear,
    selectedMonth
  );
  const { data: consumptions = [] as BudgetConsumption[] } = useBudgetConsumption(
    selectedStoreId,
    selectedYear,
    selectedMonth
  );

  // Mutations
  const createExpenseMutation = useCreateExpense();
  const approveExpenseMutation = useApproveExpense();
  const payExpenseMutation = usePayExpense();
  const createBudgetMutation = useCreateBudgetRequest();
  const approveBudgetMutation = useApproveBudgetRequest();

  // Dialog States
  const [recordExpenseOpen, setRecordExpenseOpen] = useState(false);
  const [expCategoryId, setExpCategoryId] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expMethod, setExpMethod] = useState<ExpensePaymentMethod>('CASH_PETTY');
  const [expPayee, setExpPayee] = useState('');
  const [expDescription, setExpDescription] = useState('');
  const [expReceiptUrl, setExpReceiptUrl] = useState('');
  const [expActivityType, setExpActivityType] = useState<ExpenseActivityType>('GENERAL');

  const [requestBudgetOpen, setRequestBudgetOpen] = useState(false);
  const [budgetCatId, setBudgetCatId] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetJustification, setBudgetJustification] = useState('');

  const [approveBudgetTarget, setApproveBudgetTarget] = useState<BudgetRequest | null>(null);
  const [approvedBudgetAmt, setApprovedBudgetAmt] = useState('');

  // Summaries
  const totalAllocated = consumptions.reduce((acc, c) => acc + (c.allocatedBudget || 0), 0);
  const totalSpent = consumptions.reduce((acc, c) => acc + (c.totalSpent || 0), 0);
  const overrunCount = consumptions.filter((c) => c.overrun).length;
  const netRemaining = totalAllocated - totalSpent;

  const handleOpenRecordExpense = () => {
    setExpCategoryId(categories[0]?.id ?? '');
    setExpAmount('');
    setExpDate(new Date().toISOString().split('T')[0]);
    setExpMethod('CASH_PETTY');
    setExpPayee('');
    setExpDescription('');
    setExpReceiptUrl('');
    setExpActivityType('GENERAL');
    setRecordExpenseOpen(true);
  };

  const handleConfirmRecordExpense = async () => {
    if (!selectedStoreId || !expCategoryId || !currentEmployee) return;
    await createExpenseMutation.mutateAsync({
      storeId: selectedStoreId,
      expenseCategoryId: expCategoryId,
      amount: parseFloat(expAmount) || 0,
      expenseDate: expDate,
      paymentMethod: expMethod,
      payeeName: expPayee || undefined,
      description: expDescription,
      receiptUrl: expReceiptUrl || undefined,
      createdById: currentEmployee.id,
      activityType: expActivityType,
    });
    setRecordExpenseOpen(false);
  };

  const handleOpenRequestBudget = () => {
    setBudgetCatId(categories[0]?.id ?? '');
    setBudgetAmount('');
    setBudgetJustification('');
    setRequestBudgetOpen(true);
  };

  const handleConfirmRequestBudget = async () => {
    if (!selectedStoreId || !budgetCatId || !currentEmployee) return;
    await createBudgetMutation.mutateAsync({
      storeId: selectedStoreId,
      expenseCategoryId: budgetCatId,
      periodMonth: selectedMonth,
      periodYear: selectedYear,
      requestedAmount: parseFloat(budgetAmount) || 0,
      requestedById: currentEmployee.id,
      justification: budgetJustification,
    });
    setRequestBudgetOpen(false);
  };

  const handleOpenApproveBudget = (b: BudgetRequest) => {
    setApproveBudgetTarget(b);
    setApprovedBudgetAmt(String(b.requestedAmount));
  };

  const handleConfirmApproveBudget = async (approved: boolean) => {
    if (!approveBudgetTarget || !currentEmployee) return;
    await approveBudgetMutation.mutateAsync({
      id: approveBudgetTarget.id,
      payload: {
        approvedById: currentEmployee.id,
        approvedAmount: parseFloat(approvedBudgetAmt) || 0,
        approved,
      },
    });
    setApproveBudgetTarget(null);
  };

  const handleApproveExpense = async (exp: Expense) => {
    if (!currentEmployee) return;
    await approveExpenseMutation.mutateAsync({
      id: exp.id,
      payload: {
        approvedById: currentEmployee.id,
        approved: true,
      },
    });
  };

  const handlePayExpense = async (exp: Expense) => {
    await payExpenseMutation.mutateAsync(exp.id);
  };

  return (
    <Container maxWidth={false} disableGutters>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {t("Store Expenses & Budgets")}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {t("Operational disbursements, budget caps, overrun approvals, and petty cash tracking")}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="store-select-label">{t("Store")}</InputLabel>
            <Select
              labelId="store-select-label"
              value={selectedStoreId}
              label={t("Store")}
              onChange={(e) => setStoreFilter(e.target.value)}
            >
              {stores.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel id="month-select-label">{t("Month")}</InputLabel>
            <Select
              labelId="month-select-label"
              value={selectedMonth}
              label={t("Month")}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <MenuItem key={m} value={m}>
                  {t("Month")} {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel id="year-select-label">{t("Year")}</InputLabel>
            <Select
              labelId="year-select-label"
              value={selectedYear}
              label={t("Year")}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {[2025, 2026, 2027].map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenRecordExpense}
          >
            {t("Record Expense")}
          </Button>
        </Box>
      </Box>

      {/* KPI Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              {t("MONTHLY BUDGET")}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
              {t("IDR")} {formatNumber(totalAllocated)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t("Allocated across all categories")}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              {t("MONTH-TO-DATE SPENT")}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 1, color: 'primary.main' }}>
              {t("IDR")} {formatNumber(totalSpent)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t("Approved and disbursed")}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              {t("REMAINING BUDGET")}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mt: 1,
                color: netRemaining < 0 ? 'error.main' : 'success.main',
              }}
            >
              {t("IDR")} {formatNumber(netRemaining)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {netRemaining < 0 ? t("Overall overrun") : t("Available balance")}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              {t("OVERRUN ALERTS")}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mt: 1,
                color: overrunCount > 0 ? 'error.main' : 'text.primary',
              }}
            >
              {overrunCount} {t("Categories")}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t("Requires manager authorization")}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Main Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab icon={<ReceiptLongIcon />} iconPosition="start" label={t("Expenses ({count})", undefined, { count: formatNumber(expenses.length) })} />
          <Tab icon={<PieChartIcon />} iconPosition="start" label={t("Budget Consumption")} />
          <Tab icon={<AccountBalanceWalletIcon />} iconPosition="start" label={t("Budget Requests ({count})", undefined, { count: formatNumber(budgetRequests.length) })} />
          <Tab icon={<CategoryIcon />} iconPosition="start" label={t("Categories ({count})", undefined, { count: formatNumber(categories.length) })} />
        </Tabs>

        <CardContent sx={{ p: 0 }}>
          {/* TAB 0: EXPENSES */}
          {activeTab === 0 && (
            <>
              {loadingExpenses && <LinearProgress />}
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 600 }}>{t("Expense #")}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{t("Date")}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{t("Category")}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{t("Amount (IDR)")}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{t("Method")}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{t("Payee / Desc")}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{t("Status")}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{t("Overrun")}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{t("Actions")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          {t("No expenses recorded for this store.")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenses.map((e) => (
                        <TableRow key={e.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{e.expenseNumber}</TableCell>
                          <TableCell>{formatDate(e.expenseDate)}</TableCell>
                          <TableCell>{e.expenseCategoryName}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {t("IDR")} {formatNumber((e.amount || 0))}
                          </TableCell>
                          <TableCell>
                            <Chip size="small" variant="outlined" label={e.paymentMethod.replace(/_/g, ' ')} />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {e.payeeName || 'Store Disbursement'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {e.description}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={localizeDisplayCode(e.status)}
                              color={
                                e.status === 'PAID'
                                  ? 'success'
                                  : e.status === 'APPROVED'
                                  ? 'info'
                                  : e.status === 'PENDING_APPROVAL'
                                  ? 'warning'
                                  : e.status === 'REJECTED'
                                  ? 'error'
                                  : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {e.overrun ? (
                              <Chip
                                size="small"
                                icon={<WarningAmberIcon />}
                                label={t("Overrun")}
                                color="error"
                              />
                            ) : (
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {t("Normal")}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {canManage && e.status === 'PENDING_APPROVAL' && (
                              <Button
                                size="small"
                                variant="contained"
                                color="warning"
                                onClick={() => handleApproveExpense(e)}
                                sx={{ mr: 1 }}
                              >
                                {t("Approve Overrun")}
                              </Button>
                            )}
                            {canManage && e.status === 'APPROVED' && (
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircleIcon />}
                                onClick={() => handlePayExpense(e)}
                              >
                                {t("Mark Paid")}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {/* TAB 1: BUDGET CONSUMPTION */}
          {activeTab === 1 && (
            <Box sx={{ p: 3 }}>
              {consumptions.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                  {t("No budget consumption data available for this store and period.")}
                </Typography>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  {consumptions.map((c) => (
                    <Card variant="outlined" key={c.categoryId}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {c.categoryName}
                          </Typography>
                          {c.overrun ? (
                            <Chip size="small" label={t("Budget Overrun")} color="error" icon={<WarningAmberIcon />} />
                          ) : (
                            <Chip
                              size="small"
                              label={t("{percent}% Used", undefined, {
                                percent: formatNumber(c.consumptionPercent, undefined, {
                                  minimumFractionDigits: 1,
                                  maximumFractionDigits: 1,
                                }),
                              })}
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(c.consumptionPercent, 100)}
                          color={c.overrun ? 'error' : c.consumptionPercent > 80 ? 'warning' : 'primary'}
                          sx={{ height: 8, borderRadius: 4, my: 1.5 }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {t("Spent: IDR")} {formatNumber((c.totalSpent || 0))}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {t("Budget: IDR")} {formatNumber((c.allocatedBudget || 0))}
                          </Typography>
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            mt: 0.5,
                            color: c.overrun ? 'error.main' : 'success.main',
                            fontWeight: 600,
                          }}
                        >
                          {t("Remaining: IDR")} {formatNumber((c.remainingBudget || 0))}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {/* TAB 2: BUDGET REQUESTS */}
          {activeTab === 2 && (
            <>
              {loadingBudgets && <LinearProgress />}
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={handleOpenRequestBudget}>
                  {t("New Budget Request")}
                </Button>
              </Box>
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 600 }}>{t("Request #")}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{t("Category")}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{t("Period")}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{t("Requested (IDR)")}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{t("Approved (IDR)")}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{t("Status")}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{t("Requested By")}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{t("Justification")}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{t("Actions")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {budgetRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          {t("No budget allocation requests found for this period.")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      budgetRequests.map((b) => (
                        <TableRow key={b.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{b.requestNumber}</TableCell>
                          <TableCell>{b.expenseCategoryName}</TableCell>
                          <TableCell>{b.periodMonth}/{b.periodYear}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{t("IDR")} {formatNumber((b.requestedAmount || 0))}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{t("IDR")} {formatNumber((b.approvedAmount || 0))}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={localizeDisplayCode(b.status)}
                              color={b.status === 'APPROVED' ? 'success' : b.status === 'REJECTED' ? 'error' : 'warning'}
                            />
                          </TableCell>
                          <TableCell>{b.requestedByName || '-'}</TableCell>
                          <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {b.justification || '-'}
                          </TableCell>
                          <TableCell align="right">
                            {canManage && b.status === 'SUBMITTED' && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                onClick={() => handleOpenApproveBudget(b)}
                              >
                                {t("Review & Approve")}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {/* TAB 3: CATEGORIES */}
          {activeTab === 3 && (
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 600 }}>{t("Code")}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t("Category Name")}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t("Baseline Monthly Cap")}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t("Requires Receipt")}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t("Status")}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t("Description")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((c) => (
                    <TableRow key={c.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{c.code}</TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>
                        {c.monthlyLimit != null ? `IDR ${formatNumber(c.monthlyLimit)}` : t("No cap")}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={c.requiresReceipt ? t("Mandatory") : t("Optional")}
                          color={c.requiresReceipt ? 'info' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip size="small"                         label={c.active ? t("Active") : t("Inactive")} color={c.active ? 'success' : 'default'} />
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{c.description || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Record Expense Dialog */}
      <Dialog open={recordExpenseOpen} onClose={() => setRecordExpenseOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t("Record Store Expense")}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="exp-cat-label">{t("Expense Category")}</InputLabel>
              <Select
                labelId="exp-cat-label"
                value={expCategoryId}
                label={t("Expense Category")}
                onChange={(e) => setExpCategoryId(e.target.value)}
              >
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              size="small"
              label={t("Amount (IDR)")}
              type="number"
              value={expAmount}
              onChange={(e) => setExpAmount(e.target.value)}
              required
            />
            <TextField
              fullWidth
              size="small"
              label={t("Expense Date")}
              type="date"
              value={expDate}
              onChange={(e) => setExpDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <FormControl fullWidth size="small">
              <InputLabel id="payment-method-label">{t("Payment Method")}</InputLabel>
              <Select
                labelId="payment-method-label"
                value={expMethod}
                label={t("Payment Method")}
                onChange={(e) => setExpMethod(e.target.value as ExpensePaymentMethod)}
              >
                <MenuItem value="CASH_PETTY">{t("Petty Cash")}</MenuItem>
                <MenuItem value="BANK_TRANSFER">{t("Bank Transfer")}</MenuItem>
                <MenuItem value="CREDIT_CARD">{t("Credit Card / Corporate")}</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              size="small"
              label={t("Payee / Recipient")}
              value={expPayee}
              onChange={(e) => setExpPayee(e.target.value)}
              placeholder={t("e.g. SPBU Pertamina, PLN, Toko Bangunan")}
              sx={{ gridColumn: { xs: 'span 1', sm: 'span 2' } }}
            />
            <TextField
              fullWidth
              size="small"
              label={t("Description & Purpose")}
              value={expDescription}
              onChange={(e) => setExpDescription(e.target.value)}
              multiline
              rows={2}
              required
              sx={{ gridColumn: { xs: 'span 1', sm: 'span 2' } }}
            />
            <TextField
              fullWidth
              size="small"
              label={t("Receipt / Voucher URL or Path")}
              value={expReceiptUrl}
              onChange={(e) => setExpReceiptUrl(e.target.value)}
              placeholder={t("https://...")}
              sx={{ gridColumn: { xs: 'span 1', sm: 'span 2' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecordExpenseOpen(false)}>{t("Cancel")}</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmRecordExpense}
            disabled={createExpenseMutation.isPending || !expAmount || !expDescription.trim()}
          >
            {t("Submit Expense")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Request Budget Dialog */}
      <Dialog open={requestBudgetOpen} onClose={() => setRequestBudgetOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t("Request Monthly Budget Allocation")}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t("Allocate monthly budget for period")} <strong>{selectedMonth}/{selectedYear}</strong>.
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel id="req-cat-label">{t("Expense Category")}</InputLabel>
            <Select
              labelId="req-cat-label"
              value={budgetCatId}
              label={t("Expense Category")}
              onChange={(e) => setBudgetCatId(e.target.value)}
            >
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            size="small"
            label={t("Requested Amount (IDR)")}
            type="number"
            value={budgetAmount}
            onChange={(e) => setBudgetAmount(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            fullWidth
            size="small"
            label={t("Business Justification")}
            value={budgetJustification}
            onChange={(e) => setBudgetJustification(e.target.value)}
            multiline
            rows={3}
            placeholder={t("Explain necessity for this budget allocation...")}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestBudgetOpen(false)}>{t("Cancel")}</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmRequestBudget}
            disabled={createBudgetMutation.isPending || !budgetAmount}
          >
            {t("Submit Budget Request")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review & Approve Budget Dialog */}
      <Dialog open={Boolean(approveBudgetTarget)} onClose={() => setApproveBudgetTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{t("Review Budget Request")}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t("Reviewing request")} <strong>{approveBudgetTarget?.requestNumber}</strong> {t("for")} {approveBudgetTarget?.expenseCategoryName}.
          </Typography>
          <TextField
            fullWidth
            size="small"
            label={t("Approved Amount (IDR)")}
            type="number"
            value={approvedBudgetAmt}
            onChange={(e) => setApprovedBudgetAmt(e.target.value)}
            sx={{ mb: 2 }}
          />
          {approveBudgetTarget?.justification && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {t("Justification:")} {approveBudgetTarget.justification}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleConfirmApproveBudget(false)} color="error">
            {t("Reject")}
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleConfirmApproveBudget(true)}
            disabled={approveBudgetMutation.isPending}
          >
            {t("Approve Allocation")}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
