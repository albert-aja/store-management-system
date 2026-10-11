import { apiClient } from '../../lib/apiClient';
import type {
  StockReturn,
  CreateStockReturnPayload,
  CompleteReturnPayload,
  RecordDispositionPayload,
  WarrantyClaim,
  CreateWarrantyClaimPayload,
  DecideWarrantyClaimPayload,
  RepairTicket,
  CreateRepairTicketPayload,
  CompleteRepairTicketPayload,
  StockDisposal,
  CreateStockDisposalPayload,
} from './types';

export const repossessionApi = {
  // Stock Returns & Repossessions
  listReturns: (storeId?: string, returnType?: string) =>
    apiClient.get<StockReturn[]>('/api/v1/stock-returns', {
      params: { storeId, returnType },
    }),

  getReturn: (id: string) =>
    apiClient.get<StockReturn>(`/api/v1/stock-returns/${id}`),

  createReturn: (payload: CreateStockReturnPayload) =>
    apiClient.post<StockReturn>('/api/v1/stock-returns', payload),

  completeReturn: (id: string, payload: CompleteReturnPayload) =>
    apiClient.post<StockReturn>(`/api/v1/stock-returns/${id}/complete`, payload),

  recordDisposition: (id: string, payload: RecordDispositionPayload) =>
    apiClient.post<StockReturn>(`/api/v1/stock-returns/${id}/disposition`, payload),

  // Warranty Claims
  listWarrantyClaims: (storeId?: string, status?: string) =>
    apiClient.get<WarrantyClaim[]>('/api/v1/warranty-claims', {
      params: { storeId, status },
    }),

  createWarrantyClaim: (payload: CreateWarrantyClaimPayload) =>
    apiClient.post<WarrantyClaim>('/api/v1/warranty-claims', payload),

  decideWarrantyClaim: (id: string, payload: DecideWarrantyClaimPayload) =>
    apiClient.post<WarrantyClaim>(`/api/v1/warranty-claims/${id}/decision`, payload),

  // Repair Tickets
  listRepairTickets: (storeId?: string, status?: string) =>
    apiClient.get<RepairTicket[]>('/api/v1/repair-tickets', {
      params: { storeId, status },
    }),

  createRepairTicket: (payload: CreateRepairTicketPayload) =>
    apiClient.post<RepairTicket>('/api/v1/repair-tickets', payload),

  completeRepairTicket: (id: string, payload: CompleteRepairTicketPayload) =>
    apiClient.post<RepairTicket>(`/api/v1/repair-tickets/${id}/complete`, payload),

  // Stock Disposal
  listStockDisposals: (storeId?: string) =>
    apiClient.get<StockDisposal[]>('/api/v1/stock-disposals', {
      params: { storeId },
    }),

  createStockDisposal: (payload: CreateStockDisposalPayload) =>
    apiClient.post<StockDisposal>('/api/v1/stock-disposals', payload),
};
