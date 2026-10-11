export type AttendanceStatus =
  | 'PRESENT'
  | 'LATE'
  | 'ABSENT'
  | 'ON_LEAVE'
  | 'HALF_DAY';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  storeId: string;
  storeName: string;
  workDate: string;
  checkInTime: string;
  checkOutTime?: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface ClockInRequest {
  employeeId: string;
  storeId: string;
  workDate: string;
  status?: AttendanceStatus;
  notes?: string;
}

export interface ClockOutRequest {
  checkOutTime?: string;
  notes?: string;
}

export type LeaveType =
  | 'ANNUAL'
  | 'SICK'
  | 'UNPAID'
  | 'MATERNITY'
  | 'EMERGENCY';

export type LeaveStatus = 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface LeaveRequest {
  id: string;
  requestNumber: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: LeaveStatus;
  approvedById?: string;
  approvedByName?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateLeaveRequest {
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
}

export interface ApproveLeaveRequest {
  approvedById: string;
  approved: boolean;
  notes?: string;
}

export type PayrollPeriodStatus =
  | 'DRAFT'
  | 'CALCULATED'
  | 'APPROVED'
  | 'FINALIZED';

export type PayrollPaymentStatus = 'UNPAID' | 'PAID';

export interface PayrollPeriod {
  id: string;
  periodCode: string;
  name: string;
  storeId?: string;
  storeName: string;
  startDate: string;
  endDate: string;
  cutoffDate: string;
  payoutDate: string;
  status: PayrollPeriodStatus;
  approvedById?: string;
  approvedByName?: string;
  notes?: string;
  slipCount: number;
  createdAt: string;
}

export interface CreatePayrollPeriodRequest {
  periodCode: string;
  name: string;
  storeId?: string;
  startDate: string;
  endDate: string;
  cutoffDate: string;
  payoutDate: string;
  notes?: string;
}

export interface CalculatePayrollRequest {
  defaultBaseSalary?: number;
  defaultAllowance?: number;
  calculatedById?: string;
}

export interface PayrollSlip {
  id: string;
  slipNumber: string;
  payrollPeriodId: string;
  periodCode: string;
  employeeId: string;
  employeeName: string;
  employeeCode?: string;
  baseSalary: number;
  allowances: number;
  salesCommission: number;
  collectionIncentive: number;
  deductions: number;
  netSalary: number;
  attendanceDays: number;
  paymentStatus: PayrollPaymentStatus;
  paidAt?: string;
  notes?: string;
  createdAt: string;
}
