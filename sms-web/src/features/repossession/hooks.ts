import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { repossessionApi } from './api';
import type {
  CreateStockReturnPayload,
  CompleteReturnPayload,
  RecordDispositionPayload,
  CreateWarrantyClaimPayload,
  DecideWarrantyClaimPayload,
  CreateRepairTicketPayload,
  CompleteRepairTicketPayload,
  CreateStockDisposalPayload,
} from './types';

export const repossessionKeys = {
  returns: (storeId?: string, returnType?: string) => ['stock-returns', storeId, returnType] as const,
  warrantyClaims: (storeId?: string, status?: string) => ['warranty-claims', storeId, status] as const,
  repairTickets: (storeId?: string, status?: string) => ['repair-tickets', storeId, status] as const,
  disposals: (storeId?: string) => ['stock-disposals', storeId] as const,
};

export function useStockReturns(storeId?: string, returnType?: string) {
  return useQuery({
    queryKey: repossessionKeys.returns(storeId, returnType),
    queryFn: async () => {
      const res = await repossessionApi.listReturns(storeId, returnType);
      return res.data;
    },
  });
}

export function useCreateStockReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStockReturnPayload) => repossessionApi.createReturn(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-returns'] });
    },
  });
}

export function useCompleteReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CompleteReturnPayload }) =>
      repossessionApi.completeReturn(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-returns'] });
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
      queryClient.invalidateQueries({ queryKey: ['stockUnits'] });
    },
  });
}

export function useRecordDisposition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RecordDispositionPayload }) =>
      repossessionApi.recordDisposition(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-returns'] });
      queryClient.invalidateQueries({ queryKey: ['repair-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['stockUnits'] });
    },
  });
}

export function useWarrantyClaims(storeId?: string, status?: string) {
  return useQuery({
    queryKey: repossessionKeys.warrantyClaims(storeId, status),
    queryFn: async () => {
      const res = await repossessionApi.listWarrantyClaims(storeId, status);
      return res.data;
    },
  });
}

export function useCreateWarrantyClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWarrantyClaimPayload) => repossessionApi.createWarrantyClaim(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warranty-claims'] });
    },
  });
}

export function useDecideWarrantyClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DecideWarrantyClaimPayload }) =>
      repossessionApi.decideWarrantyClaim(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warranty-claims'] });
      queryClient.invalidateQueries({ queryKey: ['repair-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['stockUnits'] });
    },
  });
}

export function useRepairTickets(storeId?: string, status?: string) {
  return useQuery({
    queryKey: repossessionKeys.repairTickets(storeId, status),
    queryFn: async () => {
      const res = await repossessionApi.listRepairTickets(storeId, status);
      return res.data;
    },
  });
}

export function useCreateRepairTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRepairTicketPayload) => repossessionApi.createRepairTicket(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repair-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['stockUnits'] });
    },
  });
}

export function useCompleteRepairTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CompleteRepairTicketPayload }) =>
      repossessionApi.completeRepairTicket(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repair-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['warranty-claims'] });
      queryClient.invalidateQueries({ queryKey: ['stockUnits'] });
    },
  });
}

export function useStockDisposals(storeId?: string) {
  return useQuery({
    queryKey: repossessionKeys.disposals(storeId),
    queryFn: async () => {
      const res = await repossessionApi.listStockDisposals(storeId);
      return res.data;
    },
  });
}

export function useCreateStockDisposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStockDisposalPayload) => repossessionApi.createStockDisposal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-disposals'] });
      queryClient.invalidateQueries({ queryKey: ['stockUnits'] });
    },
  });
}
