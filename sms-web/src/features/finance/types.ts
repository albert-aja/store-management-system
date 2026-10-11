export type ReceivableStatus =
  | "ACTIVE"
  | "PAID_IN_FULL"
  | "SETTLED_REPOSSESSION"
  | "CANCELLED";

export type InstallmentStatus = "UNPAID" | "PARTIAL" | "PAID" | "FORGIVEN";

export type PaymentType =
  | "DOWN_PAYMENT"
  | "INSTALLMENT"
  | "CASH_SALES"
  | "COD";

export type PaymentMethod = "CASH" | "BANK_TRANSFER";

export type CustodyStatus =
  | "HELD_BY_COLLECTOR"
  | "HANDED_OVER"
  | "VERIFIED_BY_CASHIER"
  | "DISCREPANCY";

export type CollectionOutcome =
  | "PAID"
  | "PARTIAL_PAID"
  | "CUSTOMER_UNAVAILABLE"
  | "PROMISED_TO_PAY"
  | "REFUSED"
  | "RESCHEDULED";

export interface ReceivableInstallment {
  id: string;
  receivableId: string;
  installmentNumber: number;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  status: InstallmentStatus;
  paidAt: string | null;
  notes: string | null;
  daysOverdue: number;
}

export interface Receivable {
  id: string;
  receivableNumber: string;
  storeId: string;
  storeName: string;
  customerId: string;
  customerName: string;
  salesOrderId: string;
  salesOrderNumber: string;
  salesOrderItemId: string | null;
  totalAmount: number;
  downPaymentAmount: number;
  financedAmount: number;
  totalPaid: number;
  remainingBalance: number;
  paymentTermMonths: number;
  status: ReceivableStatus;
  firstDueDate: string | null;
  createdAt: string;
  installments: ReceivableInstallment[];
}

export interface PaymentAllocation {
  id: string;
  customerPaymentId: string;
  receivableInstallmentId: string;
  installmentNumber: number;
  receivableNumber: string;
  amount: number;
  allocatedAt: string;
}

export interface CustomerPayment {
  id: string;
  paymentNumber: string;
  storeId: string;
  storeName: string;
  customerId: string;
  customerName: string;
  salesOrderId: string | null;
  salesOrderNumber: string | null;
  amount: number;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  collectedById: string | null;
  collectedByName: string | null;
  paidAt: string;
  unallocatedAmount: number;
  notes: string | null;
  allocations: PaymentAllocation[];
}

export interface PaymentCustody {
  id: string;
  customerPaymentId: string;
  paymentNumber: string;
  paymentAmount: number;
  holderEmployeeId: string;
  holderEmployeeName: string;
  handoverToEmployeeId: string | null;
  handoverToEmployeeName: string | null;
  status: CustodyStatus;
  expectedAmount: number;
  receivedAmount: number | null;
  discrepancyAmount: number | null;
  collectedAt: string;
  handedOverAt: string | null;
  verifiedAt: string | null;
  discrepancyNotes: string | null;
  notes: string | null;
}

export interface CollectionAttempt {
  id: string;
  storeId: string;
  storeName: string;
  customerId: string;
  customerName: string;
  receivableId: string | null;
  receivableNumber: string | null;
  assignedEmployeeId: string;
  assignedEmployeeName: string;
  visitDate: string;
  outcome: CollectionOutcome;
  promisedPaymentDate: string | null;
  customerAddressVisited: string | null;
  customerPaymentId: string | null;
  customerPaymentNumber: string | null;
  notes: string | null;
}

export interface CustomerCreditSummary {
  customerId: string;
  customerName: string;
  totalFinanced: number;
  totalPaid: number;
  remainingBalance: number;
  unallocatedCredit: number;
  activeReceivablesCount: number;
  overdueInstallmentsCount: number;
  overdueAmount: number;
}

export interface CreateReceivableInput {
  salesOrderId: string;
  salesOrderItemId?: string;
  downPaymentAmount?: number;
  firstDueDate?: string;
}

export interface RecordPaymentInput {
  storeId: string;
  customerId: string;
  salesOrderId?: string;
  amount: number;
  paymentType?: PaymentType;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  collectedById?: string;
  specificInstallmentId?: string;
  notes?: string;
}

export interface HandoverCashInput {
  handoverToEmployeeId: string;
  notes?: string;
}

export interface VerifyCashInput {
  receivedAmount: number;
  discrepancyNotes?: string;
}

export interface RecordCollectionAttemptInput {
  storeId: string;
  customerId: string;
  receivableId?: string;
  assignedEmployeeId: string;
  visitDate: string;
  outcome: CollectionOutcome;
  promisedPaymentDate?: string;
  customerAddressVisited?: string;
  customerPaymentId?: string;
  notes?: string;
}
