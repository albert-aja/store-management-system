export type BudgetRequestStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export type ExpenseStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PAID';

export type ExpensePaymentMethod = 'CASH_PETTY' | 'BANK_TRANSFER' | 'CREDIT_CARD';

export type ExpenseActivityType =
  | 'VEHICLE_MAINTENANCE'
  | 'FIELD_COLLECTION'
  | 'STORE_OPERATION'
  | 'MARKETING'
  | 'GENERAL';

export interface ExpenseCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  monthlyLimit?: number;
  requiresReceipt: boolean;
  active: boolean;
  createdAt: string;
}

export interface CreateExpenseCategoryPayload {
  code: string;
  name: string;
  description?: string;
  monthlyLimit?: number;
  requiresReceipt?: boolean;
}

export interface UpdateExpenseCategoryPayload {
  name?: string;
  description?: string;
  monthlyLimit?: number;
  requiresReceipt?: boolean;
  active?: boolean;
}

export interface BudgetRequest {
  id: string;
  requestNumber: string;
  storeId: string;
  storeName: string;
  expenseCategoryId: string;
  expenseCategoryCode: string;
  expenseCategoryName: string;
  periodMonth: number;
  periodYear: number;
  requestedAmount: number;
  approvedAmount: number;
  status: BudgetRequestStatus;
  requestedById?: string;
  requestedByName?: string;
  approvedById?: string;
  approvedByName?: string;
  justification?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateBudgetRequestPayload {
  storeId: string;
  expenseCategoryId: string;
  periodMonth: number;
  periodYear: number;
  requestedAmount: number;
  requestedById: string;
  justification?: string;
  notes?: string;
}

export interface ApproveBudgetRequestPayload {
  approvedById: string;
  approvedAmount: number;
  approved: boolean;
  notes?: string;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  storeId: string;
  storeName: string;
  expenseCategoryId: string;
  expenseCategoryCode: string;
  expenseCategoryName: string;
  budgetRequestId?: string;
  amount: number;
  expenseDate: string;
  paymentMethod: ExpensePaymentMethod;
  payeeName?: string;
  description: string;
  receiptUrl?: string;
  overrun: boolean;
  status: ExpenseStatus;
  createdById?: string;
  createdByName?: string;
  approvedById?: string;
  approvedByName?: string;
  activityType?: ExpenseActivityType;
  referenceId?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateExpensePayload {
  storeId: string;
  expenseCategoryId: string;
  budgetRequestId?: string;
  amount: number;
  expenseDate: string;
  paymentMethod: ExpensePaymentMethod;
  payeeName?: string;
  description: string;
  receiptUrl?: string;
  createdById: string;
  activityType?: ExpenseActivityType;
  referenceId?: string;
  notes?: string;
}

export interface ApproveExpensePayload {
  approvedById: string;
  approved: boolean;
  notes?: string;
}

export interface BudgetConsumption {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  periodMonth: number;
  periodYear: number;
  allocatedBudget: number;
  totalSpent: number;
  remainingBudget: number;
  overrun: boolean;
  consumptionPercent: number;
}
