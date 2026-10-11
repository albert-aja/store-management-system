import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi, leaveApi, payrollApi } from './api';
import type {
  ClockInRequest,
  ClockOutRequest,
  CreateLeaveRequest,
  ApproveLeaveRequest,
  CreatePayrollPeriodRequest,
  CalculatePayrollRequest,
  LeaveStatus,
} from './types';

export const payrollKeys = {
  attendance: (storeId?: string, workDate?: string) =>
    ['attendance', storeId, workDate] as const,
  leaveRequests: (employeeId?: string, status?: LeaveStatus) =>
    ['leave-requests', employeeId, status] as const,
  payrollPeriods: (storeId?: string) =>
    ['payroll-periods', storeId] as const,
  payrollSlips: (periodId?: string) =>
    ['payroll-slips', periodId] as const,
};

// Attendance Hooks
export function useAttendance(storeId?: string, workDate?: string) {
  return useQuery({
    queryKey: payrollKeys.attendance(storeId, workDate),
    queryFn: async () => {
      const res = await attendanceApi.listAttendance(storeId, workDate);
      return res.data;
    },
  });
}

export function useClockIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: ClockInRequest) => attendanceApi.clockIn(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useClockOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req?: ClockOutRequest }) =>
      attendanceApi.clockOut(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

// Leave Requests Hooks
export function useLeaveRequests(employeeId?: string, status?: LeaveStatus) {
  return useQuery({
    queryKey: payrollKeys.leaveRequests(employeeId, status),
    queryFn: async () => {
      const res = await leaveApi.listLeaveRequests(employeeId, status);
      return res.data;
    },
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateLeaveRequest) => leaveApi.createLeaveRequest(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
  });
}

export function useApproveLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: ApproveLeaveRequest }) =>
      leaveApi.approveLeaveRequest(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

// Payroll Periods & Slips Hooks
export function usePayrollPeriods(storeId?: string) {
  return useQuery({
    queryKey: payrollKeys.payrollPeriods(storeId),
    queryFn: async () => {
      const res = await payrollApi.listPeriods(storeId);
      return res.data;
    },
  });
}

export function useCreatePayrollPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreatePayrollPeriodRequest) => payrollApi.createPeriod(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
    },
  });
}

export function useCalculatePayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req?: CalculatePayrollRequest }) =>
      payrollApi.calculatePeriod(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-slips'] });
    },
  });
}

export function useApprovePayrollPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approverId }: { id: string; approverId: string }) =>
      payrollApi.approvePeriod(id, approverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
    },
  });
}

export function useFinalizePayrollPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payrollApi.finalizePeriod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-slips'] });
    },
  });
}

export function usePayrollSlips(periodId?: string) {
  return useQuery({
    queryKey: payrollKeys.payrollSlips(periodId),
    queryFn: async () => {
      if (!periodId) return [];
      const res = await payrollApi.getPeriodSlips(periodId);
      return res.data;
    },
    enabled: Boolean(periodId),
  });
}

export function usePayPayrollSlip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payrollApi.paySlip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-slips'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
    },
  });
}
