import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DownloadIcon from '@mui/icons-material/Download';
import TableChartIcon from '@mui/icons-material/TableChart';
import { exportFinancialAgingToExcel, exportStockBalanceToExcel, exportToExcel } from '../../lib/exportExcel';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { useNavigate } from 'react-router-dom';
import { useStores } from '../stores/hooks';
import {
  useExecutiveOverview,
  useSalesPerformance,
  useCollectionAging,
  useInventoryDistribution,
  useOperationalExceptions,
} from './hooks';
import { reportingApi } from './api';
import PeriodComparisonPanel from './PeriodComparisonPanel';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [storeFilter, setStoreFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: stores = [] } = useStores();

  // Queries
  const { data: overview } = useExecutiveOverview(storeFilter || undefined);
  const { data: salesRanking = [], isLoading: loadingSales } = useSalesPerformance(
    storeFilter || undefined,
    startDate || undefined,
    endDate || undefined
  );
  const { data: aging } = useCollectionAging(storeFilter || undefined);
  const { data: inventory } = useInventoryDistribution(storeFilter || undefined);
  const { data: exceptions = [], isLoading: loadingExceptions } = useOperationalExceptions(storeFilter || undefined);

  // CSV download handlers
  const handleDownloadReceivables = async () => {
    try {
      const csv = await reportingApi.exportReceivablesAging(storeFilter || undefined);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receivables-aging-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // handled
    }
  };

  const handleExportAgingExcel = async () => {
    try {
      const csv = await reportingApi.exportReceivablesAging(storeFilter || undefined);
      const lines = csv.trim().split('\n');
      const dataRows = lines.slice(1);
      const parsedReceivables = dataRows.map((line) => {
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const clean = (val?: string) => (val ? val.replace(/^"|"$/g, '').replace(/""/g, '"') : '');
        return {
          receivableNumber: clean(parts[0]),
          customerName: clean(parts[1]),
          customerPhone: clean(parts[2]),
          storeName: clean(parts[3]),
          financedAmount: Number(clean(parts[4])) || 0,
          remainingBalance: Number(clean(parts[5])) || 0,
          totalPaid: (Number(clean(parts[4])) || 0) - (Number(clean(parts[5])) || 0),
          paymentTermMonths: Number(clean(parts[6])) || 0,
          status: clean(parts[7]),
          firstDueDate: clean(parts[8]),
        };
      });

      const storeObj = stores.find((s) => s.id === storeFilter);
      exportFinancialAgingToExcel({
        storeName: storeObj ? storeObj.name : 'Company Wide (All Stores)',
        summary: {
          totalReceivableBalance: Number(aging?.totalReceivableBalance ?? 0),
          totalOverdueBalance: Number(aging?.totalOverdueBalance ?? 0),
          totalCollectedCash: Number(aging?.totalCollectedCash ?? 0),
          custodyDiscrepanciesCount: aging?.custodyDiscrepanciesCount ?? 0,
        },
        buckets: aging?.buckets || [],
        receivables: parsedReceivables,
      });
    } catch {
      if (aging) {
        exportFinancialAgingToExcel({
          storeName: stores.find((s) => s.id === storeFilter)?.name || 'Company Wide (All Stores)',
          summary: {
            totalReceivableBalance: Number(aging.totalReceivableBalance ?? 0),
            totalOverdueBalance: Number(aging.totalOverdueBalance ?? 0),
            totalCollectedCash: Number(aging.totalCollectedCash ?? 0),
            custodyDiscrepanciesCount: aging.custodyDiscrepanciesCount ?? 0,
          },
          buckets: aging.buckets || [],
          receivables: [],
        });
      }
    }
  };

  const handleExportSalesExcel = async () => {
    try {
      const csv = await reportingApi.exportSalesSummary(
        storeFilter || undefined,
        startDate || undefined,
        endDate || undefined
      );
      const lines = csv.trim().split('\n');
      const dataRows = lines.slice(1);
      const parsedSales = dataRows.map((line) => {
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const clean = (val?: string) => (val ? val.replace(/^"|"$/g, '').replace(/""/g, '"') : '');
        return {
          orderNumber: clean(parts[0]),
          date: clean(parts[1]),
          storeName: clean(parts[2]),
          customerName: clean(parts[3]),
          salesperson: clean(parts[4]),
          status: clean(parts[5]),
          totalAmount: Number(clean(parts[6])) || 0,
          deliveryAddress: clean(parts[7]),
        };
      });

      exportToExcel({
        filename: `sales_summary_${new Date().toISOString().substring(0, 10)}`,
        sheetName: 'Sales Orders',
        title: 'STORE MANAGEMENT SYSTEM — SALES ORDERS & REVENUE SUMMARY',
        subtitle: `Transactions between ${startDate || 'beginning'} and ${endDate || 'current'}`,
        columns: [
          { key: 'orderNumber', label: 'Order Number', width: 22 },
          { key: 'date', label: 'Date', width: 14 },
          { key: 'storeName', label: 'Store Branch', width: 20 },
          { key: 'customerName', label: 'Customer Name', width: 24 },
          { key: 'salesperson', label: 'Salesperson', width: 22 },
          { key: 'status', label: 'Order Status', width: 16 },
          { key: 'totalAmount', label: 'Total Amount (IDR)', width: 22, format: (v) => Number(v ?? 0) },
          { key: 'deliveryAddress', label: 'Delivery Address', width: 35 },
        ],
        data: parsedSales,
      });
    } catch {
      // handled
    }
  };

  const handleExportStockExcel = () => {
    exportStockBalanceToExcel({
      storeName: stores.find((s) => s.id === storeFilter)?.name || 'Company Wide (All Stores)',
      stockUnits: [],
      distribution: inventory,
    });
  };

  const handleDownloadSales = async () => {
    try {
      const csv = await reportingApi.exportSalesSummary(
        storeFilter || undefined,
        startDate || undefined,
        endDate || undefined
      );
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales-summary-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // handled
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
            Reports & Executive Insights
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cross-module real-time intelligence: sales volume, collection aging, inventory health, and operational exceptions.
          </Typography>
        </Box>

        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Filter Store Scope</InputLabel>
          <Select
            value={storeFilter}
            label="Filter Store Scope"
            onChange={(e) => setStoreFilter(e.target.value)}
          >
            <MenuItem value="">All Stores (Company Wide)</MenuItem>
            {stores.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Primary KPI Metric Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                GROSS SALES VOLUME
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Rp {Number(overview?.totalSalesAmount ?? 0).toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {overview?.totalOrdersCount ?? 0} confirmed/released orders
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PriceCheckIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                CASH COLLECTED
              </Typography>
            </Box>
            <Typography variant="h5" color="success.main" sx={{ fontWeight: 700 }}>
              Rp {Number(overview?.totalCashCollected ?? 0).toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {overview?.activeCreditAccountsCount ?? 0} active credit accounts
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AccountBalanceWalletIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                RECEIVABLES BALANCE
              </Typography>
            </Box>
            <Typography variant="h5" color="warning.main" sx={{ fontWeight: 700 }}>
              Rp {Number(overview?.totalOutstandingReceivables ?? 0).toLocaleString()}
            </Typography>
            <Typography variant="caption" color="error.main">
              Overdue: Rp {Number(overview?.overdueReceivablesAmount ?? 0).toLocaleString()}
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Inventory2Icon color="info" sx={{ mr: 1 }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                STOCK UNITS IN SYSTEM
              </Typography>
            </Box>
            <Typography variant="h5" color="info.main" sx={{ fontWeight: 700 }}>
              {overview?.totalStockUnitsCount ?? 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {overview?.warehouseUnitsCount ?? 0} WH / {overview?.showroomUnitsCount ?? 0} Showroom
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Executive Insights" icon={<AssessmentIcon />} iconPosition="start" />
          <Tab label="Comparative Analytics" icon={<CompareArrowsIcon />} iconPosition="start" />
          <Tab label="Sales Leaderboard" icon={<LeaderboardIcon />} iconPosition="start" />
          <Tab label="Collection & Aging" icon={<PriceCheckIcon />} iconPosition="start" />
          <Tab
            label={`Exceptions Center (${exceptions.length})`}
            icon={<WarningAmberIcon />}
            iconPosition="start"
          />
          <Tab label="Export Center" icon={<DownloadIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* TAB 0: Executive Insights */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            {/* Financial Overview Card */}
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Financial Position Summary
                </Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Gross Confirmed Sales</TableCell>
                      <TableCell align="right">
                        <strong>Rp {Number(overview?.totalSalesAmount ?? 0).toLocaleString()}</strong>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Total Customer Cash Inflow</TableCell>
                      <TableCell align="right" sx={{ color: 'success.main' }}>
                        <strong>Rp {Number(overview?.totalCashCollected ?? 0).toLocaleString()}</strong>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Committed Operational Expenses</TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>
                        <strong>-Rp {Number(overview?.totalExpensesAmount ?? 0).toLocaleString()}</strong>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Outstanding Credit Portfolio</TableCell>
                      <TableCell align="right">
                        <strong>Rp {Number(overview?.totalOutstandingReceivables ?? 0).toLocaleString()}</strong>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Overdue Installments (Past Due)</TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>
                        <strong>Rp {Number(overview?.overdueReceivablesAmount ?? 0).toLocaleString()}</strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Inventory Distribution Card */}
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Physical Inventory Breakdown
                </Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Warehouse Stock</TableCell>
                      <TableCell align="right">
                        <strong>{inventory?.warehouseUnits ?? 0} units</strong>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Showroom Floor Stock</TableCell>
                      <TableCell align="right">
                        <strong>{inventory?.showroomUnits ?? 0} units</strong>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Repair Area / Recovery</TableCell>
                      <TableCell align="right" sx={{ color: 'warning.main' }}>
                        <strong>{inventory?.repairAreaUnits ?? 0} units</strong>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>In-Transit (Trips & Transfers)</TableCell>
                      <TableCell align="right">
                        <strong>{inventory?.inTransitUnits ?? 0} units</strong>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Delivered at Customer</TableCell>
                      <TableCell align="right" sx={{ color: 'info.main' }}>
                        <strong>{inventory?.atCustomerUnits ?? 0} units</strong>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Available for Immediate Sale</TableCell>
                      <TableCell align="right" sx={{ color: 'success.main' }}>
                        <strong>{inventory?.availableUnits ?? 0} units</strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Stock Balance & Inventory Audit
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Multi-sheet Excel workbook detailing physical unit distribution across warehouses, showrooms, in-transit fleet, and itemized serial unit statuses.
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<TableChartIcon />}
                  onClick={handleExportStockExcel}
                >
                  Download Stock Balance Excel (.xlsx)
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* TAB 1: Comparative Analytics */}
      {activeTab === 1 && (
        <PeriodComparisonPanel storeId={storeFilter || undefined} />
      )}

      {/* TAB 2: Sales Leaderboard */}
      {activeTab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              size="small"
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: 'action.hover' }}>
                <TableRow>
                  <TableCell align="center"><strong>Rank</strong></TableCell>
                  <TableCell><strong>Salesperson</strong></TableCell>
                  <TableCell><strong>Employee #</strong></TableCell>
                  <TableCell align="center"><strong>Confirmed Orders</strong></TableCell>
                  <TableCell align="right"><strong>Total Volume (Rp)</strong></TableCell>
                  <TableCell align="right"><strong>Est. Commission (3%)</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingSales ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">Loading sales performance...</TableCell>
                  </TableRow>
                ) : salesRanking.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No sales orders found for selected date window.</TableCell>
                  </TableRow>
                ) : (
                  salesRanking.map((sp, idx) => (
                    <TableRow key={sp.salespersonId} hover>
                      <TableCell align="center">
                        <Chip
                          label={`#${idx + 1}`}
                          size="small"
                          color={idx === 0 ? 'primary' : 'default'}
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {sp.salespersonName}
                        </Typography>
                      </TableCell>
                      <TableCell>{sp.salespersonCode || '-'}</TableCell>
                      <TableCell align="center">
                        <Chip label={`${sp.confirmedOrdersCount} orders`} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          Rp {Number(sp.totalSalesVolume).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                        Rp {Number(sp.estimatedCommission).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 3: Collection & Aging */}
      {activeTab === 3 && (
        <Box>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Credit Portfolio Aging Breakdown
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Installment debts grouped by delinquency duration. Total active portfolio: Rp {Number(aging?.totalReceivableBalance ?? 0).toLocaleString()}.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                color="success"
                startIcon={<TableChartIcon />}
                onClick={handleExportAgingExcel}
              >
                Export Aging Excel (.xlsx)
              </Button>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
              {aging?.buckets?.map((bucket) => {
                const isRisk = bucket.bucketName.includes('Default') || bucket.bucketName.includes('Delinquent');
                return (
                  <Card key={bucket.bucketName} variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {bucket.bucketName.toUpperCase()}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, my: 1, color: isRisk ? 'error.main' : 'text.primary' }}>
                        Rp {Number(bucket.totalAmount).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        {bucket.installmentCount} installments ({bucket.percentage}%)
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(bucket.percentage, 100)}
                        color={isRisk ? 'error' : 'primary'}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </Box>

            {aging && aging.custodyDiscrepanciesCount > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Found <strong>{aging.custodyDiscrepanciesCount} cash custody discrepancies</strong> flagged during cashier handover verification. Check Cash Custody tab in Finance.
              </Alert>
            )}
          </Box>
        </Box>
      )}

      {/* TAB 4: Operational Exceptions Center */}
      {activeTab === 4 && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            High-Priority Operational Exceptions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Actions requiring manager review: unapproved budget overruns, cash custody short/overs, and severe default-risk accounts.
          </Typography>

          {loadingExceptions ? (
            <Typography>Loading exceptions...</Typography>
          ) : exceptions.length === 0 ? (
            <Alert severity="success">
              ✓ All operational checks clear! No unhandled budget overruns or cash discrepancies detected.
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {exceptions.map((ex, i) => (
                <Card key={i} variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <WarningAmberIcon color={ex.severity === 'HIGH' ? 'error' : 'warning'} fontSize="large" />
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {ex.title}
                          </Typography>
                          <Chip label={ex.severity} size="small" color={ex.severity === 'HIGH' ? 'error' : 'warning'} />
                          <Chip label={ex.referenceCode} size="small" variant="outlined" />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {ex.details}
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(ex.actionUrl)}
                    >
                      Resolve in Module &rarr;
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* TAB 5: Export Center */}
      {activeTab === 5 && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Download Operational & Audit Reports
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Export tabular audit sheets directly in CSV format for spreadsheet reconciliation and executive reporting.
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Receivables & Credit Aging Audit
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Complete CSV ledger containing customer accounts, telephone numbers, total contract values, current remaining balances, repayment terms, and contract statuses.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadReceivables}
                  >
                    Download Receivables CSV
                  </Button>
                  <Button
                    variant="outlined"
                    color="success"
                    startIcon={<TableChartIcon />}
                    onClick={handleExportAgingExcel}
                  >
                    Download Aging Excel (.xlsx)
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Sales Orders & Volume Audit
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Itemized sales summary with order numbers, transaction dates, assigned salespersons, customer names, confirmed order values, and delivery address snapshots.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadSales}
                  >
                    Download Sales Summary CSV
                  </Button>
                  <Button
                    variant="outlined"
                    color="success"
                    startIcon={<TableChartIcon />}
                    onClick={handleExportSalesExcel}
                  >
                    Download Sales Excel (.xlsx)
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}
    </Box>
  );
}
