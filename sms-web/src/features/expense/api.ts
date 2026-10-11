import { apiClient } from '../../lib/apiClient';
import type {
  ExpenseCategory,
  CreateExpenseCategoryPayload,
  UpdateExpenseCategoryPayload,
  BudgetRequest,
  CreateBudgetRequestPayload,
  ApproveBudgetRequestPayload,
  Expense,
  CreateExpensePayload,
  ApproveExpensePayload,
  BudgetConsumption,
} from './types';

export const expenseApi = {
  // Categories
  listCategories: (activeOnly = false) =>
    apiClient.get<ExpenseCategory[]>('/api/v1/expense-categories', {
      params: { activeOnly },
    }),

  createCategory: (payload: CreateExpenseCategoryPayload) =>
    apiClient.post<ExpenseCategory>('/api/v1/expense-categories', payload),

  updateCategory: (id: string, payload: UpdateExpenseCategoryPayload) =>
    apiClient.put<ExpenseCategory>(`/api/v1/expense-categories/${id}`, payload),

  // Budget Requests
  listBudgetRequests: (storeId?: string, year?: number, month?: number) =>
    apiClient.get<BudgetRequest[]>('/api/v1/budget-requests', {
      params: { storeId, year, month },
    }),

  createBudgetRequest: (payload: CreateBudgetRequestPayload) =>
    apiClient.post<BudgetRequest>('/api/v1/budget-requests', payload),

  approveBudgetRequest: (id: string, payload: ApproveBudgetRequestPayload) =>
    apiClient.post<BudgetRequest>(`/api/v1/budget-requests/${id}/approve`, payload),

  // Expenses
  listExpenses: (storeId?: string, status?: string, startDate?: string, endDate?: string) =>
    apiClient.get<Expense[]>('/api/v1/expenses', {
      params: { storeId, status, startDate, endDate },
    }),

  createExpense: (payload: CreateExpensePayload) =>
    apiClient.post<Expense>('/api/v1/expenses', payload),

  approveExpense: (id: string, payload: ApproveExpensePayload) =>
    apiClient.post<Expense>(`/api/v1/expenses/${id}/approve`, payload),

  payExpense: (id: string) =>
    apiClient.post<Expense>(`/api/v1/expenses/${id}/pay`),

  getBudgetConsumption: (storeId: string, year: number, month: number) =>
    apiClient.get<BudgetConsumption[]>('/api/v1/expenses/consumption', {
      params: { storeId, year, month },
    }),
};
