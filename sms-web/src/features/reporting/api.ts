import { apiClient } from '../../lib/apiClient';
import type {
  ExecutiveOverview,
  SalesPerformanceItem,
  CollectionAgingSummary,
  InventoryDistribution,
  OperationalExceptionItem,
  PeriodComparisonResponse,
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
};
