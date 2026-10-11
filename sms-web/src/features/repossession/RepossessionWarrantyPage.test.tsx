import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import RepossessionWarrantyPage from './RepossessionWarrantyPage';

vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn((selector) =>
    selector({
      user: { id: 'emp-1', fullName: 'Warehouse Staff' },
      employee: {
        id: 'emp-1',
        roleCodes: ['OWNER', 'WAREHOUSE'],
        permissionCodes: ['REPOSSESSION_MANAGE', 'WARRANTY_MANAGE'],
        fullName: 'Warehouse Staff',
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
  useStockReturns: vi.fn(() => ({
    data: [
      {
        id: 'ret-1',
        returnNumber: 'RET/ST01/10/2026/0001',
        storeId: 'store-1',
        storeName: 'Main Store',
        customerName: 'Budi Santoso',
        productVariantName: 'Honda Vario 160',
        manufacturerSerial: 'MH1KF1234567890',
        returnType: 'REPOSSESSION',
        status: 'SCHEDULED',
        scheduledDate: '2026-10-15',
      },
    ],
    isLoading: false,
  })),
  useCompleteReturn: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useRecordDisposition: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useWarrantyClaims: vi.fn(() => ({
    data: [
      {
        id: 'clm-1',
        claimNumber: 'CLM/ST01/10/2026/0001',
        storeId: 'store-1',
        storeName: 'Main Store',
        customerName: 'Siti Rahma',
        productVariantName: 'Yamaha NMAX 155',
        manufacturerSerial: 'MH3SG987654321',
        distributorName: 'PT Yamaha Motor',
        defectDescription: 'Engine knocking noise during idle',
        coverageDecision: 'PENDING',
        status: 'SUBMITTED',
      },
    ],
    isLoading: false,
  })),
  useDecideWarrantyClaim: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useRepairTickets: vi.fn(() => ({
    data: [
      {
        id: 'rep-1',
        ticketNumber: 'REP/ST01/10/2026/0001',
        storeId: 'store-1',
        storeName: 'Main Store',
        stockUnitId: 'unit-1',
        productVariantName: 'Yamaha NMAX 155',
        manufacturerSerial: 'MH3SG987654321',
        vendorName: 'Bengkel Resmi Yamaha',
        problemDescription: 'Engine knocking',
        status: 'SENT_TO_VENDOR',
      },
    ],
    isLoading: false,
  })),
  useCompleteRepairTicket: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useStockDisposals: vi.fn(() => ({
    data: [
      {
        id: 'dsp-1',
        disposalNumber: 'DIS/ST01/10/2026/0001',
        storeId: 'store-1',
        storeName: 'Main Store',
        productVariantName: 'Honda Beat 110',
        manufacturerSerial: 'MH1JF543210987',
        reason: 'Severe flood damage total loss',
        buyerName: 'Surabaya Metal Scrap',
        scrapProceeds: 1500000,
        authorizedByName: 'Pak Budi Manager',
        disposedAt: '2026-10-08T10:00:00Z',
      },
    ],
    isLoading: false,
  })),
  useCreateStockDisposal: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

describe('RepossessionWarrantyPage', () => {
  it('renders tab headers and initial returns list', () => {
    render(<RepossessionWarrantyPage />);

    expect(screen.getByText('Warranty, Returns & Disposal')).toBeInTheDocument();
    expect(screen.getByText(/Returns & Repossessions/)).toBeInTheDocument();
    expect(screen.getByText('RET/ST01/10/2026/0001')).toBeInTheDocument();
    expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
    expect(screen.getByText('Inbound Complete')).toBeInTheDocument();
  });

  it('switches between tabs cleanly', async () => {
    const user = userEvent.setup();
    render(<RepossessionWarrantyPage />);

    // Click Warranty Claims tab
    const warrantyTab = screen.getByText(/Warranty Claims/);
    await user.click(warrantyTab);
    expect(screen.getByText('CLM/ST01/10/2026/0001')).toBeInTheDocument();
    expect(screen.getByText('PT Yamaha Motor')).toBeInTheDocument();
    expect(screen.getByText('Record Decision')).toBeInTheDocument();

    // Click Repair Tickets tab
    const repairTab = screen.getByText(/Repair Tickets/);
    await user.click(repairTab);
    expect(screen.getByText('REP/ST01/10/2026/0001')).toBeInTheDocument();
    expect(screen.getByText('Bengkel Resmi Yamaha')).toBeInTheDocument();
    expect(screen.getByText('Complete Repair')).toBeInTheDocument();

    // Click Scrap Disposals tab
    const scrapTab = screen.getByText(/Scrap Disposals/);
    await user.click(scrapTab);
    expect(screen.getByText('DIS/ST01/10/2026/0001')).toBeInTheDocument();
    expect(screen.getByText('Surabaya Metal Scrap')).toBeInTheDocument();
    expect(screen.getByText('Severe flood damage total loss')).toBeInTheDocument();
  });
});
