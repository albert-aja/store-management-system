import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseApi } from './api';
import type {
  CreateExpenseCategoryPayload,
  UpdateExpenseCategoryPayload,
  CreateBudgetRequestPayload,
  ApproveBudgetRequestPayload,
  CreateExpensePayload,
  ApproveExpensePayload,
} from './types';

export const expenseKeys = {
  categories: (activeOnly?: boolean) => ['expense-categories', activeOnly] as const,
  budgetRequests: (storeId?: string, year?: number, month?: number) =>
    ['budget-requests', storeId, year, month] as const,
  expenses: (storeId?: string, status?: string, startDate?: string, endDate?: string) =>
    ['expenses', storeId, status, startDate, endDate] as const,
  consumption: (storeId: string, year: number, month: number) =>
    ['budget-consumption', storeId, year, month] as const,
};

export function useExpenseCategories(activeOnly = false) {
  return useQuery({
    queryKey: expenseKeys.categories(activeOnly),
    queryFn: async () => {
      const res = await expenseApi.listCategories(activeOnly);
      return res.data;
    },
  });
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateExpenseCategoryPayload) => expenseApi.createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    },
  });
}

export function useUpdateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateExpenseCategoryPayload }) =>
      expenseApi.updateCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    },
  });
}

export function useBudgetRequests(storeId?: string, year?: number, month?: number) {
  return useQuery({
    queryKey: expenseKeys.budgetRequests(storeId, year, month),
    queryFn: async () => {
      const res = await expenseApi.listBudgetRequests(storeId, year, month);
      return res.data;
    },
  });
}

export function useCreateBudgetRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBudgetRequestPayload) => expenseApi.createBudgetRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-requests'] });
      queryClient.invalidateQueries({ queryKey: ['budget-consumption'] });
    },
  });
}

export function useApproveBudgetRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ApproveBudgetRequestPayload }) =>
      expenseApi.approveBudgetRequest(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-requests'] });
      queryClient.invalidateQueries({ queryKey: ['budget-consumption'] });
    },
  });
}

export function useExpenses(storeId?: string, status?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: expenseKeys.expenses(storeId, status, startDate, endDate),
    queryFn: async () => {
      const res = await expenseApi.listExpenses(storeId, status, startDate, endDate);
      return res.data;
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateExpensePayload) => expenseApi.createExpense(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['budget-consumption'] });
    },
  });
}

export function useApproveExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ApproveExpensePayload }) =>
      expenseApi.approveExpense(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['budget-consumption'] });
    },
  });
}

export function usePayExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expenseApi.payExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useBudgetConsumption(storeId?: string, year?: number, month?: number) {
  return useQuery({
    queryKey: expenseKeys.consumption(storeId ?? '', year ?? 0, month ?? 0),
    queryFn: async () => {
      if (!storeId || !year || !month) return [];
      const res = await expenseApi.getBudgetConsumption(storeId, year, month);
      return res.data;
    },
    enabled: Boolean(storeId && year && month),
  });
}
