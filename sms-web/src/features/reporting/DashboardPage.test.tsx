import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import DashboardPage from './DashboardPage';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('./api', () => ({
  reportingApi: {
    exportReceivablesAging: vi.fn().mockResolvedValue('csv,content'),
    exportSalesSummary: vi.fn().mockResolvedValue('csv,content'),
  },
}));

vi.mock('../stores/hooks', () => ({
  useStores: vi.fn(() => ({
    data: [{ id: 'store-1', name: 'Main Store', code: 'ST01' }],
  })),
}));

vi.mock('./hooks', () => ({
  useExecutiveOverview: vi.fn(() => ({
    data: {
      totalSalesAmount: 75000000,
      totalOrdersCount: 25,
      totalCashCollected: 35000000,
      totalOutstandingReceivables: 40000000,
      overdueReceivablesAmount: 5000000,
      activeCreditAccountsCount: 18,
      totalStockUnitsCount: 142,
      warehouseUnitsCount: 80,
      showroomUnitsCount: 45,
      repairUnitsCount: 17,
      totalExpensesAmount: 12000000,
      totalOverrunExpensesCount: 2,
    },
    isLoading: false,
  })),
  useSalesPerformance: vi.fn(() => ({
    data: [
      {
        salespersonId: 'sp-1',
        salespersonName: 'Rudi Hartono',
        salespersonCode: 'EMP005',
        confirmedOrdersCount: 8,
        totalSalesVolume: 24000000,
        estimatedCommission: 720000,
      },
    ],
    isLoading: false,
  })),
  useCollectionAging: vi.fn(() => ({
    data: {
      buckets: [
        {
          bucketName: 'Current (0-30 days / upcoming)',
          installmentCount: 12,
          totalAmount: 20000000,
          percentage: 50.0,
        },
        {
          bucketName: 'Past Due (1-30 days)',
          installmentCount: 4,
          totalAmount: 10000000,
          percentage: 25.0,
        },
        {
          bucketName: 'Delinquent (31-60 days)',
          installmentCount: 2,
          totalAmount: 6000000,
          percentage: 15.0,
        },
        {
          bucketName: 'Default Risk (60+ days)',
          installmentCount: 1,
          totalAmount: 4000000,
          percentage: 10.0,
        },
      ],
      totalReceivableBalance: 40000000,
      totalOverdueBalance: 20000000,
      totalCollectedCash: 35000000,
      custodyDiscrepanciesCount: 1,
    },
    isLoading: false,
  })),
  useInventoryDistribution: vi.fn(() => ({
    data: {
      totalUnits: 142,
      warehouseUnits: 80,
      showroomUnits: 45,
      repairAreaUnits: 17,
      inTransitUnits: 0,
      atCustomerUnits: 0,
      availableUnits: 110,
      reservedUnits: 15,
      unavailableUnits: 17,
    },
    isLoading: false,
  })),
  useOperationalExceptions: vi.fn(() => ({
    data: [
      {
        exceptionType: 'BUDGET_OVERRUN',
        title: 'Expense Overrun Authorization Required',
        severity: 'HIGH',
        referenceCode: 'EXP/ST01/10/2026/0002',
        details: 'Expense of Rp 1,500,000 exceeds monthly category limit',
        actionUrl: '/expenses',
      },
    ],
    isLoading: false,
  })),
}));

describe('DashboardPage', () => {
  it('renders header, primary KPI cards, and financial overview', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Reports & Executive Insights')).toBeInTheDocument();
    expect(screen.getByText('GROSS SALES VOLUME')).toBeInTheDocument();
    expect(screen.getByText('CASH COLLECTED')).toBeInTheDocument();
    expect(screen.getByText('RECEIVABLES BALANCE')).toBeInTheDocument();
    expect(screen.getByText('STOCK UNITS IN SYSTEM')).toBeInTheDocument();
    expect(screen.getByText('Financial Position Summary')).toBeInTheDocument();
  });

  it('switches tabs and displays leaderboard and exceptions', async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    // Switch to Sales Leaderboard
    await user.click(screen.getByRole('tab', { name: /sales leaderboard/i }));
    expect(screen.getByText('Rudi Hartono')).toBeInTheDocument();
    expect(screen.getByText('EMP005')).toBeInTheDocument();

    // Switch to Collection & Aging
    await user.click(screen.getByRole('tab', { name: /collection & aging/i }));
    expect(screen.getByText('Credit Portfolio Aging Breakdown')).toBeInTheDocument();
    expect(screen.getByText('CURRENT (0-30 DAYS / UPCOMING)')).toBeInTheDocument();

    // Switch to Exceptions Center
    await user.click(screen.getByRole('tab', { name: /exceptions center/i }));
    expect(screen.getByText('Expense Overrun Authorization Required')).toBeInTheDocument();
    expect(screen.getByText('Resolve in Module →')).toBeInTheDocument();

    // Switch to Export Center
    await user.click(screen.getByRole('tab', { name: /export center/i }));
    expect(screen.getByText('Download Operational & Audit Reports')).toBeInTheDocument();
    expect(screen.getByText('Download Receivables CSV')).toBeInTheDocument();
    expect(screen.getByText('Download Sales Summary CSV')).toBeInTheDocument();
  });
});
