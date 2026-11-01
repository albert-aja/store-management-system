import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ScheduledReportsModal } from './ScheduledReportsModal';
import { reportingApi } from './api';

vi.mock('./api', () => ({
  reportingApi: {
    getScheduledConfigs: vi.fn(),
    createScheduledConfig: vi.fn(),
    updateScheduledConfig: vi.fn(),
    deleteScheduledConfig: vi.fn(),
    triggerScheduledReport: vi.fn(),
    getScheduledLogs: vi.fn(),
    previewRecipients: vi.fn(),
    downloadFinancialAgingXlsx: vi.fn(),
    downloadStockBalanceXlsx: vi.fn(),
  },
}));

vi.mock('../stores/hooks', () => ({
  useStores: () => ({
    data: [
      { id: 'store-1', name: 'Surabaya Flagship' },
      { id: 'store-2', name: 'Malang Branch' },
    ],
  }),
}));

const mockConfigs = [
  {
    id: 'cfg-1',
    name: 'Daily Store Operations Digest',
    reportType: 'ALL_COMBINED' as const,
    frequency: 'DAILY' as const,
    dayOfWeek: null,
    dispatchTime: '08:00',
    storeId: 'store-1',
    storeName: 'Surabaya Flagship',
    targetRole: 'MANAGER',
    customRecipientEmails: 'gm@smsmart.co.id',
    enabled: true,
    lastRunAt: '2026-11-01T08:00:00Z',
    lastStatus: 'SUCCESS' as const,
    lastErrorMessage: null,
    createdAt: '2026-10-15T00:00:00Z',
  },
];

const mockLogs = [
  {
    id: 'log-1',
    configId: 'cfg-1',
    configName: 'Daily Store Operations Digest',
    executedAt: '2026-11-01T08:00:00Z',
    reportType: 'ALL_COMBINED' as const,
    status: 'SUCCESS' as const,
    recipientsCount: 2,
    recipientEmails: 'manager@smsmart.co.id, gm@smsmart.co.id',
    attachmentsGenerated: 'financial_aging_report_20261101.xlsx, stock_balance_report_20261101.xlsx',
    durationMs: 245,
    errorMessage: null,
  },
];

describe('ScheduledReportsModal (Task G.9)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
    vi.mocked(reportingApi.getScheduledConfigs).mockResolvedValue({ data: mockConfigs } as any);
    vi.mocked(reportingApi.getScheduledLogs).mockResolvedValue({ data: mockLogs } as any);
  });

  const renderModal = (open = true) =>
    render(
      <QueryClientProvider client={queryClient}>
        <ScheduledReportsModal open={open} onClose={vi.fn()} selectedStoreId="store-1" />
      </QueryClientProvider>
    );

  it('renders modal header, tabs, and scheduled report configurations table', async () => {
    renderModal();

    expect(screen.getByText('Automated Scheduled Reports & Email Digest (G.9)')).toBeInTheDocument();
    expect(screen.getByText('Active Digest Schedules')).toBeInTheDocument();
    expect(screen.getByText('Execution Audit Log')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Daily Store Operations Digest')).toBeInTheDocument();
      expect(screen.getByText('Surabaya Flagship')).toBeInTheDocument();
      expect(screen.getByText('Send Now')).toBeInTheDocument();
    });
  });

  it('triggers immediate report dispatch when Send Now is clicked', async () => {
    vi.mocked(reportingApi.triggerScheduledReport).mockResolvedValue({
      data: {
        success: true,
        message: 'Digest successfully dispatched to 2 manager recipient(s)',
        logId: 'log-1',
        recipientsDispatched: 2,
        recipientEmails: ['manager@smsmart.co.id', 'gm@smsmart.co.id'],
        attachments: ['financial_aging_report_20261101.xlsx'],
        durationMs: 310,
      },
    } as any);

    renderModal();

    await waitFor(() => {
      expect(screen.getByText('Send Now')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Send Now'));

    await waitFor(() => {
      expect(reportingApi.triggerScheduledReport).toHaveBeenCalledWith('cfg-1');
      expect(
        screen.getByText(/Daily Store Operations Digest: Digest successfully dispatched to 2 manager recipient/i)
      ).toBeInTheDocument();
    });
  });

  it('switches to Execution Audit Log tab and displays past dispatches and attachments', async () => {
    renderModal();

    await waitFor(() => {
      expect(screen.getByText('Execution Audit Log')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Execution Audit Log'));

    await waitFor(() => {
      expect(screen.getByText('2 recipients')).toBeInTheDocument();
      expect(screen.getByText(/financial_aging_report_20261101.xlsx/i)).toBeInTheDocument();
      expect(screen.getByText('245 ms')).toBeInTheDocument();
    });
  });

  it('opens create modal and resolves recipient preview', async () => {
    vi.mocked(reportingApi.previewRecipients).mockResolvedValue({
      data: {
        count: 2,
        storeId: 'store-1',
        storeName: 'Surabaya Flagship',
        targetRole: 'MANAGER',
        emails: ['budi@smsmart.co.id', 'operations@smsmart.co.id'],
        managerNames: ['Budi Santoso'],
      },
    } as any);

    renderModal();

    await waitFor(() => {
      expect(screen.getByText('New Digest Schedule')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('New Digest Schedule'));

    expect(screen.getByText('Create Automated Digest Schedule')).toBeInTheDocument();

    const previewBtn = screen.getByText('Preview Resolved Recipients');
    fireEvent.click(previewBtn);

    await waitFor(() => {
      expect(reportingApi.previewRecipients).toHaveBeenCalled();
      expect(screen.getByText(/2 Recipient\(s\) Resolved for Surabaya Flagship/i)).toBeInTheDocument();
      expect(screen.getByText('budi@smsmart.co.id')).toBeInTheDocument();
    });
  });
});
