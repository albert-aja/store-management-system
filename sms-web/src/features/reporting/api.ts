import { apiClient } from '../../lib/apiClient';
import type {
  ExecutiveOverview,
  SalesPerformanceItem,
  CollectionAgingSummary,
  InventoryDistribution,
  OperationalExceptionItem,
  PeriodComparisonResponse,
  ScheduledReportConfig,
  ScheduledReportLog,
  RecipientPreview,
  TriggerDispatchResult,
} from './types';

export const reportingApi = {
  getOverview: (storeId?: string) =>
    apiClient.get<ExecutiveOverview>('/api/v1/reporting/overview', {
      params: { storeId },
    }),

  getSalesPerformance: (storeId?: string, startDate?: string, endDate?: string) =>
    apiClient.get<SalesPerformanceItem[]>('/api/v1/reporting/sales-performance', {
      params: { storeId, startDate, endDate },
    }),

  getCollectionAging: (storeId?: string) =>
    apiClient.get<CollectionAgingSummary>('/api/v1/reporting/collection-aging', {
      params: { storeId },
    }),

  getPeriodComparison: (
    storeId?: string,
    primaryStart?: string,
    primaryEnd?: string,
    compareStart?: string,
    compareEnd?: string,
  ) =>
    apiClient.get<PeriodComparisonResponse>('/api/v1/reporting/period-comparison', {
      params: { storeId, primaryStart, primaryEnd, compareStart, compareEnd },
    }),

  getInventoryDistribution: (storeId?: string) =>
    apiClient.get<InventoryDistribution>('/api/v1/reporting/inventory-distribution', {
      params: { storeId },
    }),

  getExceptions: (storeId?: string) =>
    apiClient.get<OperationalExceptionItem[]>('/api/v1/reporting/exceptions', {
      params: { storeId },
    }),

  exportReceivablesAging: async (storeId?: string) => {
    const res = await apiClient.get<string>('/api/v1/reporting/export/receivables-aging', {
      params: { storeId },
      responseType: 'text',
    });
    return res.data;
  },

  exportSalesSummary: async (storeId?: string, startDate?: string, endDate?: string) => {
    const res = await apiClient.get<string>('/api/v1/reporting/export/sales-summary', {
      params: { storeId, startDate, endDate },
      responseType: 'text',
    });
    return res.data;
  },

  // ── Scheduled Reports Endpoints (G.9) ──────────────────────────────────────

  getScheduledConfigs: (storeId?: string) =>
    apiClient.get<ScheduledReportConfig[]>('/api/v1/reporting/scheduled/configs', {
      params: { storeId: storeId || undefined },
    }),

  getScheduledConfig: (id: string) =>
    apiClient.get<ScheduledReportConfig>(`/api/v1/reporting/scheduled/configs/${id}`),

  createScheduledConfig: (req: Partial<ScheduledReportConfig>) =>
    apiClient.post<ScheduledReportConfig>('/api/v1/reporting/scheduled/configs', req),

  updateScheduledConfig: (id: string, req: Partial<ScheduledReportConfig>) =>
    apiClient.put<ScheduledReportConfig>(`/api/v1/reporting/scheduled/configs/${id}`, req),

  deleteScheduledConfig: (id: string) =>
    apiClient.delete<void>(`/api/v1/reporting/scheduled/configs/${id}`),

  triggerScheduledReport: (id: string) =>
    apiClient.post<TriggerDispatchResult>(`/api/v1/reporting/scheduled/configs/${id}/trigger`),

  getScheduledLogs: (configId?: string, limit = 30) =>
    apiClient.get<ScheduledReportLog[]>('/api/v1/reporting/scheduled/logs', {
      params: { configId: configId || undefined, limit },
    }),

  previewRecipients: (storeId?: string, targetRole = 'MANAGER', customRecipientEmails?: string) =>
    apiClient.get<RecipientPreview>('/api/v1/reporting/scheduled/preview-recipients', {
      params: { storeId: storeId || undefined, targetRole, customRecipientEmails },
    }),

  downloadFinancialAgingXlsx: async (storeId?: string) => {
    const res = await apiClient.get<Blob>('/api/v1/reporting/export/financial-aging.xlsx', {
      params: { storeId: storeId || undefined },
      responseType: 'blob',
    });
    return res.data;
  },

  downloadStockBalanceXlsx: async (storeId?: string) => {
    const res = await apiClient.get<Blob>('/api/v1/reporting/export/stock-balance.xlsx', {
      params: { storeId: storeId || undefined },
      responseType: 'blob',
    });
    return res.data;
  },
};
