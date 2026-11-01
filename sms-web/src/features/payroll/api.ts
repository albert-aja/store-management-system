import { apiClient } from '../../lib/apiClient';
import type {
  AttendanceRecord,
  ClockInRequest,
  ClockOutRequest,
  LeaveRequest,
  CreateLeaveRequest,
  ApproveLeaveRequest,
  PayrollPeriod,
  CreatePayrollPeriodRequest,
  CalculatePayrollRequest,
  PayrollSlip,
  LeaveStatus,
} from './types';

export const attendanceApi = {
  listAttendance: (storeId?: string, workDate?: string) =>
    apiClient.get<AttendanceRecord[]>('/api/v1/attendance', {
      params: { storeId, workDate },
    }),

  clockIn: (req: ClockInRequest) =>
    apiClient.post<AttendanceRecord>('/api/v1/attendance/clock-in', req),

  clockOut: (id: string, req?: ClockOutRequest) =>
    apiClient.post<AttendanceRecord>(`/api/v1/attendance/${id}/clock-out`, req),
};

export const leaveApi = {
  listLeaveRequests: (employeeId?: string, status?: LeaveStatus) =>
    apiClient.get<LeaveRequest[]>('/api/v1/leave-requests', {
      params: { employeeId, status },
    }),

  createLeaveRequest: (req: CreateLeaveRequest) =>
    apiClient.post<LeaveRequest>('/api/v1/leave-requests', req),

  approveLeaveRequest: (id: string, req: ApproveLeaveRequest) =>
    apiClient.post<LeaveRequest>(`/api/v1/leave-requests/${id}/approve`, req),
};

export const payrollApi = {
  listPeriods: (storeId?: string) =>
    apiClient.get<PayrollPeriod[]>('/api/v1/payroll/periods', {
      params: { storeId },
    }),

  createPeriod: (req: CreatePayrollPeriodRequest) =>
    apiClient.post<PayrollPeriod>('/api/v1/payroll/periods', req),

  calculatePeriod: (id: string, req?: CalculatePayrollRequest) =>
    apiClient.post<PayrollPeriod>(`/api/v1/payroll/periods/${id}/calculate`, req),

  approvePeriod: (id: string, approverId: string) =>
    apiClient.post<PayrollPeriod>(`/api/v1/payroll/periods/${id}/approve`, null, {
      params: { approverId },
    }),

  finalizePeriod: (id: string) =>
    apiClient.post<PayrollPeriod>(`/api/v1/payroll/periods/${id}/finalize`),

  getPeriodSlips: (id: string) =>
    apiClient.get<PayrollSlip[]>(`/api/v1/payroll/periods/${id}/slips`),

  paySlip: (id: string) =>
    apiClient.post<PayrollSlip>(`/api/v1/payroll/slips/${id}/pay`),
};

import type { CommissionTier, CommissionTierRequest } from './types';

export const commissionTierApi = {
  listTiers: () => apiClient.get<CommissionTier[]>('/api/v1/commission-tiers'),
  createTier: (req: CommissionTierRequest) =>
    apiClient.post<CommissionTier>('/api/v1/commission-tiers', req),
  updateTier: (id: string, req: CommissionTierRequest) =>
    apiClient.put<CommissionTier>(`/api/v1/commission-tiers/${id}`, req),
  deleteTier: (id: string) =>
    apiClient.delete<void>(`/api/v1/commission-tiers/${id}`),
};
