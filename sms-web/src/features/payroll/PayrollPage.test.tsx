import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PayrollPage from './PayrollPage';

vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn((selector) =>
    selector({
      employee: {
        id: 'emp-1',
        roleCodes: ['OWNER', 'MANAGER'],
        permissionCodes: ['HR_MANAGE', 'PAYROLL_MANAGE'],
        fullName: 'Budi Manager',
      },
      hasRole: () => true,
      hasPermission: () => true,
    })
  ),
}));

vi.mock('../stores/hooks', () => ({
  useStores: vi.fn(() => ({
    data: [{ id: 'store-1', name: 'Main Store', code: 'ST01' }],
  })),
}));

vi.mock('../employees/hooks', () => ({
  useEmployees: vi.fn(() => ({
    data: [
      { id: 'emp-1', fullName: 'Budi Manager', employeeNumber: 'EMP001' },
      { id: 'emp-2', fullName: 'Siti Sales', employeeNumber: 'EMP002' },
    ],
  })),
}));

vi.mock('./hooks', () => ({
  usePayrollPeriods: vi.fn(() => ({
    data: [
      {
        id: 'prd-1',
        periodCode: 'PRD-2026-10',
        name: 'October 2026 Sales Period',
        storeId: 'store-1',
        storeName: 'Main Store',
        startDate: '2026-10-05',
        endDate: '2026-11-01',
        cutoffDate: '2026-11-01',
        payoutDate: '2026-11-02',
        status: 'CALCULATED',
        slipCount: 2,
      },
    ],
    isLoading: false,
  })),
  useAttendance: vi.fn(() => ({
    data: [
      {
        id: 'attd-1',
        employeeId: 'emp-2',
        employeeName: 'Siti Sales',
        storeId: 'store-1',
        storeName: 'Main Store',
        workDate: '2026-10-09',
        checkInTime: '2026-10-09T08:00:00Z',
        checkOutTime: null,
        status: 'PRESENT',
        notes: 'Regular shift',
      },
    ],
    isLoading: false,
  })),
  useLeaveRequests: vi.fn(() => ({
    data: [
      {
        id: 'leave-1',
        requestNumber: 'LVE/ST01/10/2026/0001',
        employeeId: 'emp-2',
        employeeName: 'Siti Sales',
        leaveType: 'ANNUAL',
        startDate: '2026-10-15',
        endDate: '2026-10-16',
        daysCount: 2,
        reason: 'Family event',
        status: 'SUBMITTED',
      },
    ],
    isLoading: false,
  })),
  usePayrollSlips: vi.fn(() => ({
    data: [
      {
        id: 'slip-1',
        slipNumber: 'SLIP/ST01/10/2026/0001',
        payrollPeriodId: 'prd-1',
        periodCode: 'PRD-2026-10',
        employeeId: 'emp-2',
        employeeName: 'Siti Sales',
        employeeCode: 'EMP002',
        baseSalary: 4500000,
        allowances: 500000,
        salesCommission: 350000,
        collectionIncentive: 0,
        deductions: 0,
        netSalary: 5350000,
        attendanceDays: 24,
        paymentStatus: 'UNPAID',
      },
    ],
    isLoading: false,
  })),
  useCreatePayrollPeriod: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useCalculatePayroll: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useApprovePayrollPeriod: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useFinalizePayrollPeriod: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  usePayPayrollSlip: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useClockIn: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useClockOut: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useCreateLeaveRequest: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useApproveLeaveRequest: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

describe('PayrollPage', () => {
  it('renders header, KPI metrics, and payroll periods table', () => {
    render(<PayrollPage />);

    expect(screen.getByText('HR & Payroll Management')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE PERIODS')).toBeInTheDocument();
    expect(screen.getByText('PRD-2026-10')).toBeInTheDocument();
    expect(screen.getByText('October 2026 Sales Period')).toBeInTheDocument();
    expect(screen.getByText('Create Payroll Period')).toBeInTheDocument();
  });

  it('switches between tabs cleanly', async () => {
    const user = userEvent.setup();
    render(<PayrollPage />);

    // Switch to Attendance Roster
    await user.click(screen.getByRole('tab', { name: /attendance roster/i }));
    expect(screen.getByText('Record Clock-In')).toBeInTheDocument();
    expect(screen.getByText('Siti Sales')).toBeInTheDocument();

    // Switch to Leave Requests
    await user.click(screen.getByRole('tab', { name: /leave requests/i }));
    expect(screen.getByText('Apply Leave Request')).toBeInTheDocument();
    expect(screen.getByText('LVE/ST01/10/2026/0001')).toBeInTheDocument();
    expect(screen.getByText('Family event')).toBeInTheDocument();
  });
});
