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
    <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Store Expenses & Budgets
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Operational disbursements, budget caps, overrun approvals, and petty cash tracking
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="store-select-label">Store</InputLabel>
            <Select
              labelId="store-select-label"
              value={selectedStoreId}
              label="Store"
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
            <InputLabel id="month-select-label">Month</InputLabel>
            <Select
              labelId="month-select-label"
              value={selectedMonth}
              label="Month"
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <MenuItem key={m} value={m}>
                  Month {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel id="year-select-label">Year</InputLabel>
            <Select
              labelId="year-select-label"
              value={selectedYear}
              label="Year"
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
            Record Expense
          </Button>
        </Box>
      </Box>

      {/* KPI Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              MONTHLY BUDGET
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
              IDR {totalAllocated.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Allocated across all categories
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              MONTH-TO-DATE SPENT
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 1, color: 'primary.main' }}>
              IDR {totalSpent.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Approved and disbursed
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              REMAINING BUDGET
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mt: 1,
                color: netRemaining < 0 ? 'error.main' : 'success.main',
              }}
            >
              IDR {netRemaining.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {netRemaining < 0 ? 'Overall overrun' : 'Available balance'}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              OVERRUN ALERTS
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mt: 1,
                color: overrunCount > 0 ? 'error.main' : 'text.primary',
              }}
            >
              {overrunCount} Categories
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Requires manager authorization
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
          <Tab icon={<ReceiptLongIcon />} iconPosition="start" label={`Expenses (${expenses.length})`} />
          <Tab icon={<PieChartIcon />} iconPosition="start" label="Budget Consumption" />
          <Tab icon={<AccountBalanceWalletIcon />} iconPosition="start" label={`Budget Requests (${budgetRequests.length})`} />
          <Tab icon={<CategoryIcon />} iconPosition="start" label={`Categories (${categories.length})`} />
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
                      <TableCell sx={{ fontWeight: 600 }}>Expense #</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Amount (IDR)</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Payee / Desc</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Overrun</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No expenses recorded for this store.
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenses.map((e) => (
                        <TableRow key={e.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{e.expenseNumber}</TableCell>
                          <TableCell>{e.expenseDate}</TableCell>
                          <TableCell>{e.expenseCategoryName}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            IDR {(e.amount || 0).toLocaleString()}
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
                              label={e.status.replace(/_/g, ' ')}
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
                                label="Overrun"
                                color="error"
                              />
                            ) : (
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                Normal
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
                                Approve Overrun
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
                                Mark Paid
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
                  No budget consumption data available for this store and period.
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
                            <Chip size="small" label="Budget Overrun" color="error" icon={<WarningAmberIcon />} />
                          ) : (
                            <Chip size="small" label={`${c.consumptionPercent.toFixed(1)}% Used`} color="primary" variant="outlined" />
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
                            Spent: IDR {(c.totalSpent || 0).toLocaleString()}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Budget: IDR {(c.allocatedBudget || 0).toLocaleString()}
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
                          Remaining: IDR {(c.remainingBudget || 0).toLocaleString()}
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
                  New Budget Request
                </Button>
              </Box>
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Request #</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Requested (IDR)</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Approved (IDR)</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Requested By</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Justification</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {budgetRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No budget allocation requests found for this period.
                        </TableCell>
                      </TableRow>
                    ) : (
                      budgetRequests.map((b) => (
                        <TableRow key={b.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{b.requestNumber}</TableCell>
                          <TableCell>{b.expenseCategoryName}</TableCell>
                          <TableCell>{b.periodMonth}/{b.periodYear}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>IDR {(b.requestedAmount || 0).toLocaleString()}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>IDR {(b.approvedAmount || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={b.status}
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
                                Review & Approve
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
                    <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Category Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Baseline Monthly Cap</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Requires Receipt</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((c) => (
                    <TableRow key={c.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{c.code}</TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>
                        {c.monthlyLimit != null ? `IDR ${c.monthlyLimit.toLocaleString()}` : 'No cap'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={c.requiresReceipt ? 'Mandatory' : 'Optional'}
                          color={c.requiresReceipt ? 'info' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={c.active ? 'Active' : 'Inactive'} color={c.active ? 'success' : 'default'} />
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
        <DialogTitle>Record Store Expense</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="exp-cat-label">Expense Category</InputLabel>
              <Select
                labelId="exp-cat-label"
                value={expCategoryId}
                label="Expense Category"
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
              label="Amount (IDR)"
              type="number"
              value={expAmount}
              onChange={(e) => setExpAmount(e.target.value)}
              required
            />
            <TextField
              fullWidth
              size="small"
              label="Expense Date"
              type="date"
              value={expDate}
              onChange={(e) => setExpDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <FormControl fullWidth size="small">
              <InputLabel id="payment-method-label">Payment Method</InputLabel>
              <Select
                labelId="payment-method-label"
                value={expMethod}
                label="Payment Method"
                onChange={(e) => setExpMethod(e.target.value as ExpensePaymentMethod)}
              >
                <MenuItem value="CASH_PETTY">Petty Cash</MenuItem>
                <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                <MenuItem value="CREDIT_CARD">Credit Card / Corporate</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              size="small"
              label="Payee / Recipient"
              value={expPayee}
              onChange={(e) => setExpPayee(e.target.value)}
              placeholder="e.g. SPBU Pertamina, PLN, Toko Bangunan"
              sx={{ gridColumn: { xs: 'span 1', sm: 'span 2' } }}
            />
            <TextField
              fullWidth
              size="small"
              label="Description & Purpose"
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
              label="Receipt / Voucher URL or Path"
              value={expReceiptUrl}
              onChange={(e) => setExpReceiptUrl(e.target.value)}
              placeholder="https://..."
              sx={{ gridColumn: { xs: 'span 1', sm: 'span 2' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecordExpenseOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmRecordExpense}
            disabled={createExpenseMutation.isPending || !expAmount || !expDescription.trim()}
          >
            Submit Expense
          </Button>
        </DialogActions>
      </Dialog>

      {/* Request Budget Dialog */}
      <Dialog open={requestBudgetOpen} onClose={() => setRequestBudgetOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Monthly Budget Allocation</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Allocate monthly budget for period <strong>{selectedMonth}/{selectedYear}</strong>.
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel id="req-cat-label">Expense Category</InputLabel>
            <Select
              labelId="req-cat-label"
              value={budgetCatId}
              label="Expense Category"
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
            label="Requested Amount (IDR)"
            type="number"
            value={budgetAmount}
            onChange={(e) => setBudgetAmount(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            fullWidth
            size="small"
            label="Business Justification"
            value={budgetJustification}
            onChange={(e) => setBudgetJustification(e.target.value)}
            multiline
            rows={3}
            placeholder="Explain necessity for this budget allocation..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestBudgetOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmRequestBudget}
            disabled={createBudgetMutation.isPending || !budgetAmount}
          >
            Submit Budget Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review & Approve Budget Dialog */}
      <Dialog open={Boolean(approveBudgetTarget)} onClose={() => setApproveBudgetTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Review Budget Request</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Reviewing request <strong>{approveBudgetTarget?.requestNumber}</strong> for {approveBudgetTarget?.expenseCategoryName}.
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="Approved Amount (IDR)"
            type="number"
            value={approvedBudgetAmt}
            onChange={(e) => setApprovedBudgetAmt(e.target.value)}
            sx={{ mb: 2 }}
          />
          {approveBudgetTarget?.justification && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Justification: {approveBudgetTarget.justification}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleConfirmApproveBudget(false)} color="error">
            Reject
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleConfirmApproveBudget(true)}
            disabled={approveBudgetMutation.isPending}
          >
            Approve Allocation
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
