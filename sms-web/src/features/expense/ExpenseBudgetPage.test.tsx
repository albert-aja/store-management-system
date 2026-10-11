import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ExpenseBudgetPage from './ExpenseBudgetPage';

vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn((selector) =>
    selector({
      employee: {
        id: 'emp-1',
        roleCodes: ['OWNER', 'MANAGER'],
        permissionCodes: ['EXPENSE_MANAGE', 'BUDGET_MANAGE'],
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

vi.mock('./hooks', () => ({
  useExpenseCategories: vi.fn(() => ({
    data: [
      {
        id: 'cat-1',
        code: 'VEHICLE_OPS',
        name: 'Vehicle Fuel & Maintenance',
        monthlyLimit: 5000000,
        requiresReceipt: true,
        active: true,
      },
    ],
  })),
  useExpenses: vi.fn(() => ({
    data: [
      {
        id: 'exp-1',
        expenseNumber: 'EXP/ST01/10/2026/0001',
        storeId: 'store-1',
        storeName: 'Main Store',
        expenseCategoryId: 'cat-1',
        expenseCategoryName: 'Vehicle Fuel & Maintenance',
        amount: 350000,
        expenseDate: '2026-10-08',
        paymentMethod: 'CASH_PETTY',
        payeeName: 'SPBU Pertamina',
        description: 'Fuel delivery van',
        overrun: false,
        status: 'PAID',
      },
    ],
    isLoading: false,
  })),
  useBudgetRequests: vi.fn(() => ({
    data: [
      {
        id: 'bdg-1',
        requestNumber: 'BDG/ST01/10/2026/0001',
        storeId: 'store-1',
        storeName: 'Main Store',
        expenseCategoryId: 'cat-1',
        expenseCategoryName: 'Vehicle Fuel & Maintenance',
        periodMonth: 10,
        periodYear: 2026,
        requestedAmount: 6000000,
        approvedAmount: 5500000,
        status: 'APPROVED',
        requestedByName: 'Budi Manager',
      },
    ],
    isLoading: false,
  })),
  useBudgetConsumption: vi.fn(() => ({
    data: [
      {
        categoryId: 'cat-1',
        categoryCode: 'VEHICLE_OPS',
        categoryName: 'Vehicle Fuel & Maintenance',
        periodMonth: 10,
        periodYear: 2026,
        allocatedBudget: 5500000,
        totalSpent: 350000,
        remainingBudget: 5150000,
        overrun: false,
        consumptionPercent: 6.36,
      },
    ],
  })),
  useCreateExpense: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useApproveExpense: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  usePayExpense: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useCreateBudgetRequest: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useApproveBudgetRequest: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

describe('ExpenseBudgetPage', () => {
  it('renders header, KPI metrics, and expenses table', () => {
    render(<ExpenseBudgetPage />);

    expect(screen.getByText('Store Expenses & Budgets')).toBeInTheDocument();
    expect(screen.getByText('MONTHLY BUDGET')).toBeInTheDocument();
    expect(screen.getByText('MONTH-TO-DATE SPENT')).toBeInTheDocument();
    expect(screen.getByText('REMAINING BUDGET')).toBeInTheDocument();
    expect(screen.getByText('EXP/ST01/10/2026/0001')).toBeInTheDocument();
    expect(screen.getByText('SPBU Pertamina')).toBeInTheDocument();
  });

  it('switches between tabs cleanly', async () => {
    const user = userEvent.setup();
    render(<ExpenseBudgetPage />);

    // Click Budget Consumption tab
    const consumptionTab = screen.getByRole('tab', { name: /Budget Consumption/ });
    await user.click(consumptionTab);
    expect(screen.getByText(/6.4% Used/)).toBeInTheDocument();

    // Click Budget Requests tab
    const requestsTab = screen.getByRole('tab', { name: /Budget Requests/ });
    await user.click(requestsTab);
    expect(screen.getByText('BDG/ST01/10/2026/0001')).toBeInTheDocument();

    // Click Categories tab
    const catTab = screen.getByRole('tab', { name: /Categories/ });
    await user.click(catTab);
    expect(screen.getByText('VEHICLE_OPS')).toBeInTheDocument();
  });
});
