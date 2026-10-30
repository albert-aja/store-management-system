import { useQuery } from '@tanstack/react-query';
import { reportingApi } from './api';

export const reportingKeys = {
  overview: (storeId?: string) => ['reporting-overview', storeId] as const,
  salesPerformance: (storeId?: string, startDate?: string, endDate?: string) =>
    ['reporting-sales-performance', storeId, startDate, endDate] as const,
  collectionAging: (storeId?: string) => ['reporting-collection-aging', storeId] as const,
  periodComparison: (
    storeId?: string,
    primaryStart?: string,
    primaryEnd?: string,
    compareStart?: string,
    compareEnd?: string,
  ) =>
    [
      'reporting-period-comparison',
      storeId,
      primaryStart,
      primaryEnd,
      compareStart,
      compareEnd,
    ] as const,
  inventoryDistribution: (storeId?: string) => ['reporting-inventory-distribution', storeId] as const,
  exceptions: (storeId?: string) => ['reporting-exceptions', storeId] as const,
};

export function useExecutiveOverview(storeId?: string) {
  return useQuery({
    queryKey: reportingKeys.overview(storeId),
    queryFn: async () => {
      const res = await reportingApi.getOverview(storeId);
      return res.data;
    },
  });
}

export function useSalesPerformance(storeId?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: reportingKeys.salesPerformance(storeId, startDate, endDate),
    queryFn: async () => {
      const res = await reportingApi.getSalesPerformance(storeId, startDate, endDate);
      return res.data;
    },
  });
}

export function useCollectionAging(storeId?: string) {
  return useQuery({
    queryKey: reportingKeys.collectionAging(storeId),
    queryFn: async () => {
      const res = await reportingApi.getCollectionAging(storeId);
      return res.data;
    },
  });
}

export function usePeriodComparison(
  storeId?: string,
  primaryStart?: string,
  primaryEnd?: string,
  compareStart?: string,
  compareEnd?: string,
) {
  return useQuery({
    queryKey: reportingKeys.periodComparison(
      storeId,
      primaryStart,
      primaryEnd,
      compareStart,
      compareEnd,
    ),
    queryFn: async () => {
      const res = await reportingApi.getPeriodComparison(
        storeId,
        primaryStart,
        primaryEnd,
        compareStart,
        compareEnd,
      );
      return res.data;
    },
    enabled: Boolean(primaryStart && primaryEnd && compareStart && compareEnd),
  });
}

export function useInventoryDistribution(storeId?: string) {
  return useQuery({
    queryKey: reportingKeys.inventoryDistribution(storeId),
    queryFn: async () => {
      const res = await reportingApi.getInventoryDistribution(storeId);
      return res.data;
    },
  });
}

export function useOperationalExceptions(storeId?: string) {
  return useQuery({
    queryKey: reportingKeys.exceptions(storeId),
    queryFn: async () => {
      const res = await reportingApi.getExceptions(storeId);
      return res.data;
    },
  });
}
