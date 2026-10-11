import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReceivable,
  getCustomerCreditSummary,
  getReceivable,
  handoverCash,
  listCollectionAttempts,
  listCustomerPayments,
  listPaymentCustodies,
  listReceivables,
  listReceivablesBySalesOrder,
  recordCollectionAttempt,
  recordCustomerPayment,
  verifyCash,
} from "./api";
import type {
  CreateReceivableInput,
  HandoverCashInput,
  ReceivableStatus,
  RecordCollectionAttemptInput,
  RecordPaymentInput,
  VerifyCashInput,
} from "./types";

export function useReceivables(params?: {
  storeId?: string;
  customerId?: string;
  status?: ReceivableStatus;
}) {
  return useQuery({
    queryKey: ["finance", "receivables", params],
    queryFn: () => listReceivables(params),
  });
}

export function useReceivable(id: string) {
  return useQuery({
    queryKey: ["finance", "receivables", id],
    queryFn: () => getReceivable(id),
    enabled: !!id,
  });
}

export function useReceivablesBySalesOrder(salesOrderId: string) {
  return useQuery({
    queryKey: ["finance", "receivables", "by-so", salesOrderId],
    queryFn: () => listReceivablesBySalesOrder(salesOrderId),
    enabled: !!salesOrderId,
  });
}

export function useCustomerCreditSummary(customerId: string) {
  return useQuery({
    queryKey: ["finance", "customer-summary", customerId],
    queryFn: () => getCustomerCreditSummary(customerId),
    enabled: !!customerId,
  });
}

export function useCreateReceivable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReceivableInput) => createReceivable(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "receivables"] });
      queryClient.invalidateQueries({ queryKey: ["finance", "customer-summary"] });
    },
  });
}

export function useCustomerPayments(params?: {
  storeId?: string;
  customerId?: string;
}) {
  return useQuery({
    queryKey: ["finance", "payments", params],
    queryFn: () => listCustomerPayments(params),
  });
}

export function useRecordCustomerPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordPaymentInput) => recordCustomerPayment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
  });
}

export function usePaymentCustodies(params?: {
  holderId?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ["finance", "custodies", params],
    queryFn: () => listPaymentCustodies(params),
  });
}

export function useHandoverCash() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: HandoverCashInput }) =>
      handoverCash(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "custodies"] });
    },
  });
}

export function useVerifyCash() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: VerifyCashInput }) =>
      verifyCash(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "custodies"] });
    },
  });
}

export function useCollectionAttempts(params?: {
  storeId?: string;
  customerId?: string;
}) {
  return useQuery({
    queryKey: ["finance", "collections", params],
    queryFn: () => listCollectionAttempts(params),
  });
}

export function useRecordCollectionAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordCollectionAttemptInput) =>
      recordCollectionAttempt(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "collections"] });
    },
  });
}
