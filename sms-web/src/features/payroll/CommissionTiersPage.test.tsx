import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CommissionTiersPage from './CommissionTiersPage';
import { commissionTierApi } from './api';

vi.mock('./api', () => ({
  commissionTierApi: {
    listTiers: vi.fn(),
    createTier: vi.fn(),
    updateTier: vi.fn(),
    deleteTier: vi.fn(),
  },
}));

const mockTiers = [
  {
    id: 'tier-1',
    tierName: 'Bronze',
    minSalesVolume: 0,
    maxSalesVolume: 30000000,
    commissionRate: 0.01,
    colorCode: '#CD7F32',
    displayOrder: 1,
    isActive: true,
    storeId: null,
  },
  {
    id: 'tier-2',
    tierName: 'Silver',
    minSalesVolume: 30000000,
    maxSalesVolume: 60000000,
    commissionRate: 0.015,
    colorCode: '#C0C0C0',
    displayOrder: 2,
    isActive: true,
    storeId: null,
  },
  {
    id: 'tier-3',
    tierName: 'Gold',
    minSalesVolume: 60000000,
    maxSalesVolume: 100000000,
    commissionRate: 0.02,
    colorCode: '#FFD700',
    displayOrder: 3,
    isActive: true,
    storeId: null,
  },
  {
    id: 'tier-4',
    tierName: 'Platinum',
    minSalesVolume: 100000000,
    maxSalesVolume: null,
    commissionRate: 0.025,
    colorCode: '#7986CB',
    displayOrder: 4,
    isActive: true,
    storeId: null,
  },
];

describe('CommissionTiersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (commissionTierApi.listTiers as any).mockResolvedValue({ data: mockTiers });
  });

  it('renders header, tier cards summary, and tiers table', async () => {
    render(<CommissionTiersPage />);

    expect(
      screen.getByText('Showroom Floor Sales Commission Tiers')
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('Bronze').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Silver').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Gold').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Platinum').length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText('1.00%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('1.50%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2.00%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2.50%').length).toBeGreaterThan(0);
  });

  it('opens create modal when Add Commission Tier button is clicked', async () => {
    render(<CommissionTiersPage />);

    const addBtn = await screen.findByRole('button', {
      name: /Add Commission Tier/i,
    });
    await userEvent.click(addBtn);

    expect(screen.getByText('Create Commission Tier')).toBeInTheDocument();
    expect(screen.getByLabelText(/Tier Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Minimum Sales Volume/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Commission Rate/i)).toBeInTheDocument();
  });
});
