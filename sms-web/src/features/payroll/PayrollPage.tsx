import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
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
import CalculateIcon from '@mui/icons-material/Calculate';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import PaymentsIcon from '@mui/icons-material/Payments';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TimeToLeaveIcon from '@mui/icons-material/TimeToLeave';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useAuthStore } from '../../store/authStore';
import { useStores } from '../stores/hooks';
import { useEmployees } from '../employees/hooks';
import {
  useAttendance,
  useClockIn,
  useClockOut,
  useLeaveRequests,
  useCreateLeaveRequest,
  useApproveLeaveRequest,
  usePayrollPeriods,
  useCreatePayrollPeriod,
  useCalculatePayroll,
  useApprovePayrollPeriod,
  useFinalizePayrollPeriod,
  usePayrollSlips,
  usePayPayrollSlip,
} from './hooks';
import type {
  AttendanceRecord,
  AttendanceStatus,
  LeaveRequest,
  LeaveType,
  LeaveStatus,
  PayrollPeriod,
  PayrollPeriodStatus,
  PayrollSlip,
} from './types';

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [storeFilter, setStoreFilter] = useState('');
  const [workDateFilter, setWorkDateFilter] = useState('');
  const [leaveStatusFilter, setLeaveStatusFilter] = useState<LeaveStatus | ''>('');

  const { data: stores = [] } = useStores();
  const { data: employees = [] } = useEmployees();
  const currentEmployee = useAuthStore((s) => s.employee);
  const canManage = useAuthStore(
    (s) =>
      s.hasPermission('HR_MANAGE') ||
      s.hasPermission('PAYROLL_MANAGE') ||
      s.hasRole('OWNER') ||
      s.hasRole('MANAGER')
  );

  // Queries
  const { data: periods = [] as PayrollPeriod[], isLoading: loadingPeriods } =
    usePayrollPeriods(storeFilter || undefined);
  const { data: attendanceList = [] as AttendanceRecord[], isLoading: loadingAttendance } =
    useAttendance(storeFilter || undefined, workDateFilter || undefined);
  const { data: leaveRequests = [] as LeaveRequest[], isLoading: loadingLeaves } =
    useLeaveRequests(undefined, leaveStatusFilter || undefined);

  // Selected period for viewing slips
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const { data: periodSlips = [] as PayrollSlip[], isLoading: loadingSlips } =
    usePayrollSlips(selectedPeriod?.id);

  // Dialog states
  const [openPeriodDialog, setOpenPeriodDialog] = useState(false);
  const [openCalcDialog, setOpenCalcDialog] = useState(false);
  const [calcTargetPeriod, setCalcTargetPeriod] = useState<PayrollPeriod | null>(null);
  const [openClockInDialog, setOpenClockInDialog] = useState(false);
  const [openLeaveDialog, setOpenLeaveDialog] = useState(false);

  // Form states
  const [periodForm, setPeriodForm] = useState({
    periodCode: `PRD-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    name: `Payroll Period ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
    storeId: '',
    startDate: '',
    endDate: '',
    cutoffDate: '',
    payoutDate: '',
    notes: '',
  });

  const [calcForm, setCalcForm] = useState({
    defaultBaseSalary: 4500000,
    defaultAllowance: 500000,
  });

  const [clockInForm, setClockInForm] = useState({
    employeeId: '',
    storeId: '',
    workDate: new Date().toISOString().split('T')[0],
    status: 'PRESENT' as AttendanceStatus,
    notes: '',
  });

  const [leaveForm, setLeaveForm] = useState({
    employeeId: '',
    leaveType: 'ANNUAL' as LeaveType,
    startDate: '',
    endDate: '',
    daysCount: 1,
    reason: '',
  });

  // Action mutations
  const createPeriodMutation = useCreatePayrollPeriod();
  const calculateMutation = useCalculatePayroll();
  const approvePeriodMutation = useApprovePayrollPeriod();
  const finalizePeriodMutation = useFinalizePayrollPeriod();
  const paySlipMutation = usePayPayrollSlip();
  const clockInMutation = useClockIn();
  const clockOutMutation = useClockOut();
  const createLeaveMutation = useCreateLeaveRequest();
  const approveLeaveMutation = useApproveLeaveRequest();

  // Handlers
  const handleCreatePeriod = async () => {
    await createPeriodMutation.mutateAsync({
      ...periodForm,
      storeId: periodForm.storeId || undefined,
    });
    setOpenPeriodDialog(false);
  };

  const handleCalculatePeriod = async () => {
    if (!calcTargetPeriod) return;
    await calculateMutation.mutateAsync({
      id: calcTargetPeriod.id,
      req: {
        defaultBaseSalary: calcForm.defaultBaseSalary,
        defaultAllowance: calcForm.defaultAllowance,
        calculatedById: currentEmployee?.id,
      },
    });
    setOpenCalcDialog(false);
    if (selectedPeriod?.id === calcTargetPeriod.id) {
      setSelectedPeriod({ ...calcTargetPeriod, status: 'CALCULATED' });
    }
  };

  const handleApprovePeriod = async (p: PayrollPeriod) => {
    if (!currentEmployee?.id) return;
    await approvePeriodMutation.mutateAsync({
      id: p.id,
      approverId: currentEmployee.id,
    });
  };

  const handleFinalizePeriod = async (p: PayrollPeriod) => {
    await finalizePeriodMutation.mutateAsync(p.id);
  };

  const handlePaySlip = async (slipId: string) => {
    await paySlipMutation.mutateAsync(slipId);
  };

  const handleClockIn = async () => {
    await clockInMutation.mutateAsync({
      employeeId: clockInForm.employeeId,
      storeId: clockInForm.storeId,
      workDate: clockInForm.workDate,
      status: clockInForm.status,
      notes: clockInForm.notes || undefined,
    });
    setOpenClockInDialog(false);
  };

  const handleClockOut = async (recordId: string) => {
    await clockOutMutation.mutateAsync({
      id: recordId,
      req: { notes: 'Clocked out from web management' },
    });
  };

  const handleCreateLeave = async () => {
    await createLeaveMutation.mutateAsync(leaveForm);
    setOpenLeaveDialog(false);
  };

  const handleApproveLeave = async (leaveId: string, approved: boolean) => {
    if (!currentEmployee?.id) return;
    await approveLeaveMutation.mutateAsync({
      id: leaveId,
      req: {
        approvedById: currentEmployee.id,
        approved,
        notes: approved ? 'Approved by HR/Manager' : 'Rejected by HR/Manager',
      },
    });
  };

  // Metrics summary
  const totalPeriods = periods.length;
  const activePeriods = periods.filter((p) => p.status !== 'FINALIZED').length;
  const finalizedPeriods = periods.filter((p) => p.status === 'FINALIZED').length;
  const todayAttendanceCount = attendanceList.length;

  const getStatusColor = (status: PayrollPeriodStatus) => {
    switch (status) {
      case 'FINALIZED':
        return 'success';
      case 'APPROVED':
        return 'primary';
      case 'CALCULATED':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getAttendanceColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT':
        return 'success';
      case 'LATE':
        return 'warning';
      case 'ON_LEAVE':
        return 'info';
      case 'HALF_DAY':
        return 'secondary';
      case 'ABSENT':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
          HR & Payroll Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track employee attendance, manage leave requests, and calculate non-calendar sales periods with strict payroll freezing.
        </Typography>
      </Box>

      {/* KPI Metric Cards */}
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
              <ScheduleIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                ACTIVE PERIODS
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {activePeriods}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {totalPeriods} total registered periods
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LockIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                FINALIZED PERIODS
              </Typography>
            </Box>
            <Typography variant="h5" color="success.main" sx={{ fontWeight: 700 }}>
              {finalizedPeriods}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Strictly frozen & unalterable
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <EventAvailableIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                ATTENDANCE LOGGED
              </Typography>
            </Box>
            <Typography variant="h5" color="info.main" sx={{ fontWeight: 700 }}>
              {todayAttendanceCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Filtered date records
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TimeToLeaveIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                PENDING LEAVES
              </Typography>
            </Box>
            <Typography variant="h5" color="warning.main" sx={{ fontWeight: 700 }}>
              {leaveRequests.filter((l) => l.status === 'SUBMITTED').length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Awaiting manager review
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
        >
          <Tab label="Payroll Periods & Slips" icon={<PaymentsIcon />} iconPosition="start" />
          <Tab label="Attendance Roster" icon={<EventAvailableIcon />} iconPosition="start" />
          <Tab label="Leave Requests" icon={<TimeToLeaveIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* TAB 0: Payroll Periods & Slips */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Filter by Store</InputLabel>
                <Select
                  value={storeFilter}
                  label="Filter by Store"
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

            {canManage && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenPeriodDialog(true)}
              >
                Create Payroll Period
              </Button>
            )}
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: 'action.hover' }}>
                <TableRow>
                  <TableCell><strong>Period Code</strong></TableCell>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Store</strong></TableCell>
                  <TableCell><strong>Date Range</strong></TableCell>
                  <TableCell><strong>Cutoff / Payout</strong></TableCell>
                  <TableCell align="center"><strong>Slips</strong></TableCell>
                  <TableCell align="center"><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingPeriods ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">Loading payroll periods...</TableCell>
                  </TableRow>
                ) : periods.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">No payroll periods found. Create one to calculate compensation.</TableCell>
                  </TableRow>
                ) : (
                  periods.map((p) => (
                    <TableRow
                      key={p.id}
                      hover
                      selected={selectedPeriod?.id === p.id}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => setSelectedPeriod(p)}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {p.periodCode}
                        </Typography>
                      </TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{p.storeName}</TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          {p.startDate} &rarr; {p.endDate}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          Cutoff: {p.cutoffDate}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Payout: {p.payoutDate}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={`${p.slipCount} slips`} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={p.status}
                          size="small"
                          color={getStatusColor(p.status)}
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button
                            size="small"
                            variant={selectedPeriod?.id === p.id ? 'contained' : 'outlined'}
                            startIcon={<VisibilityIcon />}
                            onClick={() => setSelectedPeriod(p)}
                          >
                            Slips
                          </Button>

                          {canManage && p.status !== 'FINALIZED' && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              startIcon={<CalculateIcon />}
                              onClick={() => {
                                setCalcTargetPeriod(p);
                                setOpenCalcDialog(true);
                              }}
                            >
                              Calculate
                            </Button>
                          )}

                          {canManage && p.status === 'CALCULATED' && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              startIcon={<CheckCircleIcon />}
                              onClick={() => handleApprovePeriod(p)}
                            >
                              Approve
                            </Button>
                          )}

                          {canManage && p.status === 'APPROVED' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="secondary"
                              startIcon={<LockIcon />}
                              onClick={() => handleFinalizePeriod(p)}
                            >
                              Finalize & Freeze
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Selected Period Slips Detail Table */}
          {selectedPeriod && (
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Payroll Slips for {selectedPeriod.periodCode} — {selectedPeriod.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedPeriod.status === 'FINALIZED' ? (
                      <span style={{ color: '#2e7d32', fontWeight: 600 }}>
                        ✓ Period is strictly finalized. Calculation parameters and slips are immutable.
                      </span>
                    ) : (
                      'Review salary items, commission, incentives, and attendance days.'
                    )}
                  </Typography>
                </Box>
              </Box>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead sx={{ backgroundColor: 'action.hover' }}>
                    <TableRow>
                      <TableCell><strong>Slip #</strong></TableCell>
                      <TableCell><strong>Employee</strong></TableCell>
                      <TableCell align="right"><strong>Base Salary</strong></TableCell>
                      <TableCell align="right"><strong>Allowances</strong></TableCell>
                      <TableCell align="right"><strong>Commission</strong></TableCell>
                      <TableCell align="right"><strong>Incentive</strong></TableCell>
                      <TableCell align="right"><strong>Deductions</strong></TableCell>
                      <TableCell align="right"><strong>Net Salary</strong></TableCell>
                      <TableCell align="center"><strong>Attd Days</strong></TableCell>
                      <TableCell align="center"><strong>Status</strong></TableCell>
                      <TableCell align="right"><strong>Action</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingSlips ? (
                      <TableRow>
                        <TableCell colSpan={11} align="center">Loading payroll slips...</TableCell>
                      </TableRow>
                    ) : periodSlips.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} align="center">
                          No slips generated yet. Click "Calculate" on the period above to calculate compensation.
                        </TableCell>
                      </TableRow>
                    ) : (
                      periodSlips.map((s) => (
                        <TableRow key={s.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {s.slipNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {s.employeeName}
                            </Typography>
                            {s.employeeCode && (
                              <Typography variant="caption" color="text.secondary">
                                {s.employeeCode}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">Rp {Number(s.baseSalary).toLocaleString()}</TableCell>
                          <TableCell align="right">Rp {Number(s.allowances).toLocaleString()}</TableCell>
                          <TableCell align="right" sx={{ color: 'success.main', fontWeight: 500 }}>
                            Rp {Number(s.salesCommission).toLocaleString()}
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'info.main', fontWeight: 500 }}>
                            Rp {Number(s.collectionIncentive).toLocaleString()}
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'error.main' }}>
                            -Rp {Number(s.deductions).toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              Rp {Number(s.netSalary).toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={`${s.attendanceDays} days`} size="small" />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={s.paymentStatus}
                              size="small"
                              color={s.paymentStatus === 'PAID' ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {canManage && s.paymentStatus !== 'PAID' && (
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => handlePaySlip(s.id)}
                              >
                                Disburse
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>
      )}

      {/* TAB 1: Attendance Roster */}
      {activeTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Filter by Store</InputLabel>
                <Select
                  value={storeFilter}
                  label="Filter by Store"
                  onChange={(e) => setStoreFilter(e.target.value)}
                >
                  <MenuItem value="">All Stores</MenuItem>
                  {stores.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                size="small"
                type="date"
                label="Filter Work Date"
                value={workDateFilter}
                onChange={(e) => setWorkDateFilter(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>

            {canManage && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenClockInDialog(true)}
              >
                Record Clock-In
              </Button>
            )}
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: 'action.hover' }}>
                <TableRow>
                  <TableCell><strong>Employee</strong></TableCell>
                  <TableCell><strong>Store</strong></TableCell>
                  <TableCell><strong>Work Date</strong></TableCell>
                  <TableCell><strong>Check In</strong></TableCell>
                  <TableCell><strong>Check Out</strong></TableCell>
                  <TableCell align="center"><strong>Status</strong></TableCell>
                  <TableCell><strong>Notes</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingAttendance ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">Loading attendance logs...</TableCell>
                  </TableRow>
                ) : attendanceList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">No attendance records found for criteria.</TableCell>
                  </TableRow>
                ) : (
                  attendanceList.map((a) => (
                    <TableRow key={a.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {a.employeeName}
                        </Typography>
                      </TableCell>
                      <TableCell>{a.storeName}</TableCell>
                      <TableCell>{a.workDate}</TableCell>
                      <TableCell>
                        {a.checkInTime ? new Date(a.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </TableCell>
                      <TableCell>
                        {a.checkOutTime ? new Date(a.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={a.status}
                          size="small"
                          color={getAttendanceColor(a.status)}
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {a.notes || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {canManage && !a.checkOutTime && a.status !== 'ON_LEAVE' && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleClockOut(a.id)}
                          >
                            Clock Out
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 2: Leave Requests */}
      {activeTab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={leaveStatusFilter}
                  label="Status"
                  onChange={(e) => setLeaveStatusFilter(e.target.value as LeaveStatus | '')}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="SUBMITTED">SUBMITTED</MenuItem>
                  <MenuItem value="APPROVED">APPROVED</MenuItem>
                  <MenuItem value="REJECTED">REJECTED</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenLeaveDialog(true)}
            >
              Apply Leave Request
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: 'action.hover' }}>
                <TableRow>
                  <TableCell><strong>Request #</strong></TableCell>
                  <TableCell><strong>Employee</strong></TableCell>
                  <TableCell><strong>Leave Type</strong></TableCell>
                  <TableCell><strong>Date Range</strong></TableCell>
                  <TableCell align="center"><strong>Days</strong></TableCell>
                  <TableCell><strong>Reason</strong></TableCell>
                  <TableCell align="center"><strong>Status</strong></TableCell>
                  <TableCell><strong>Approved By</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingLeaves ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">Loading leave requests...</TableCell>
                  </TableRow>
                ) : leaveRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">No leave requests found.</TableCell>
                  </TableRow>
                ) : (
                  leaveRequests.map((l) => (
                    <TableRow key={l.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {l.requestNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>{l.employeeName}</TableCell>
                      <TableCell>
                        <Chip label={l.leaveType} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        {l.startDate} &rarr; {l.endDate}
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={`${l.daysCount} days`} size="small" />
                      </TableCell>
                      <TableCell>{l.reason}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={l.status}
                          size="small"
                          color={
                            l.status === 'APPROVED'
                              ? 'success'
                              : l.status === 'REJECTED'
                              ? 'error'
                              : 'warning'
                          }
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        {l.approvedByName ? (
                          <Typography variant="caption" sx={{ display: 'block' }}>
                            {l.approvedByName}
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {canManage && l.status === 'SUBMITTED' && (
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              onClick={() => handleApproveLeave(l.id, true)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleApproveLeave(l.id, false)}
                            >
                              Reject
                            </Button>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Dialog: Create Payroll Period */}
      <Dialog open={openPeriodDialog} onClose={() => setOpenPeriodDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Payroll Period</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Period Code"
            value={periodForm.periodCode}
            onChange={(e) => setPeriodForm({ ...periodForm, periodCode: e.target.value })}
            required
            fullWidth
          />
          <TextField
            label="Period Name"
            value={periodForm.name}
            onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
            required
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Store Scope</InputLabel>
            <Select
              value={periodForm.storeId}
              label="Store Scope"
              onChange={(e) => setPeriodForm({ ...periodForm, storeId: e.target.value })}
            >
              <MenuItem value="">All Stores (Company Wide)</MenuItem>
              {stores.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Start Date"
            type="date"
            value={periodForm.startDate}
            onChange={(e) => setPeriodForm({ ...periodForm, startDate: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            required
            fullWidth
          />
          <TextField
            label="End Date"
            type="date"
            value={periodForm.endDate}
            onChange={(e) => setPeriodForm({ ...periodForm, endDate: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            required
            fullWidth
          />
          <TextField
            label="Cutoff Date"
            type="date"
            value={periodForm.cutoffDate}
            onChange={(e) => setPeriodForm({ ...periodForm, cutoffDate: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            required
            fullWidth
          />
          <TextField
            label="Payout Date"
            type="date"
            value={periodForm.payoutDate}
            onChange={(e) => setPeriodForm({ ...periodForm, payoutDate: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            required
            fullWidth
          />
          <TextField
            label="Notes / Description"
            value={periodForm.notes}
            onChange={(e) => setPeriodForm({ ...periodForm, notes: e.target.value })}
            multiline
            rows={2}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPeriodDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreatePeriod}
            disabled={!periodForm.periodCode || !periodForm.startDate || !periodForm.endDate || !periodForm.cutoffDate || !periodForm.payoutDate}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Calculate Payroll */}
      <Dialog open={openCalcDialog} onClose={() => setOpenCalcDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Calculate Period Payroll</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <Alert severity="info">
            Calculating payroll for period <strong>{calcTargetPeriod?.periodCode}</strong>.
            This computes attendance-prorated base salary, sales commissions on confirmed orders, and collection incentives on verified payments.
          </Alert>
          <TextField
            label="Default Base Salary (Rp)"
            type="number"
            value={calcForm.defaultBaseSalary}
            onChange={(e) => setCalcForm({ ...calcForm, defaultBaseSalary: Number(e.target.value) })}
            fullWidth
          />
          <TextField
            label="Default Allowance (Rp)"
            type="number"
            value={calcForm.defaultAllowance}
            onChange={(e) => setCalcForm({ ...calcForm, defaultAllowance: Number(e.target.value) })}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCalcDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<CalculateIcon />}
            onClick={handleCalculatePeriod}
          >
            Run Calculation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Record Clock-In */}
      <Dialog open={openClockInDialog} onClose={() => setOpenClockInDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Employee Clock-In</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth required>
            <InputLabel>Employee</InputLabel>
            <Select
              value={clockInForm.employeeId}
              label="Employee"
              onChange={(e) => setClockInForm({ ...clockInForm, employeeId: e.target.value })}
            >
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.employeeNumber})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth required>
            <InputLabel>Store</InputLabel>
            <Select
              value={clockInForm.storeId}
              label="Store"
              onChange={(e) => setClockInForm({ ...clockInForm, storeId: e.target.value })}
            >
              {stores.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Work Date"
            type="date"
            value={clockInForm.workDate}
            onChange={(e) => setClockInForm({ ...clockInForm, workDate: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            required
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={clockInForm.status}
              label="Status"
              onChange={(e) => setClockInForm({ ...clockInForm, status: e.target.value as AttendanceStatus })}
            >
              <MenuItem value="PRESENT">PRESENT</MenuItem>
              <MenuItem value="LATE">LATE</MenuItem>
              <MenuItem value="HALF_DAY">HALF_DAY</MenuItem>
              <MenuItem value="ON_LEAVE">ON_LEAVE</MenuItem>
              <MenuItem value="ABSENT">ABSENT</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Notes"
            value={clockInForm.notes}
            onChange={(e) => setClockInForm({ ...clockInForm, notes: e.target.value })}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenClockInDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleClockIn}
            disabled={!clockInForm.employeeId || !clockInForm.storeId || !clockInForm.workDate}
          >
            Clock In
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Create Leave Request */}
      <Dialog open={openLeaveDialog} onClose={() => setOpenLeaveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Apply Leave Request</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth required>
            <InputLabel>Employee</InputLabel>
            <Select
              value={leaveForm.employeeId}
              label="Employee"
              onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value })}
            >
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.employeeNumber})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth required>
            <InputLabel>Leave Type</InputLabel>
            <Select
              value={leaveForm.leaveType}
              label="Leave Type"
              onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value as LeaveType })}
            >
              <MenuItem value="ANNUAL">ANNUAL</MenuItem>
              <MenuItem value="SICK">SICK</MenuItem>
              <MenuItem value="UNPAID">UNPAID</MenuItem>
              <MenuItem value="MATERNITY">MATERNITY</MenuItem>
              <MenuItem value="EMERGENCY">EMERGENCY</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Start Date"
            type="date"
            value={leaveForm.startDate}
            onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            required
            fullWidth
          />
          <TextField
            label="End Date"
            type="date"
            value={leaveForm.endDate}
            onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            required
            fullWidth
          />
          <TextField
            label="Days Count"
            type="number"
            value={leaveForm.daysCount}
            onChange={(e) => setLeaveForm({ ...leaveForm, daysCount: Number(e.target.value) })}
            slotProps={{ htmlInput: { min: 1 } }}
            required
            fullWidth
          />
          <TextField
            label="Reason"
            value={leaveForm.reason}
            onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
            multiline
            rows={2}
            required
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLeaveDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateLeave}
            disabled={!leaveForm.employeeId || !leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason}
          >
            Submit Leave Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
