export interface Supplier {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  notes: string | null;
  active: boolean;
}

export interface SupplierInput {
  name: string;
  code?: string;
  address?: string;
  notes?: string;
}

export interface SupplierContact {
  id: string;
  contactType: string;
  label: string | null;
  value: string;
  notes: string | null;
  active: boolean;
}

export interface SupplierContactInput {
  contactType: string;
  label?: string;
  value: string;
  notes?: string;
}

export type PurchaseOrderStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "REJECTED"
  | "ISSUED"
  | "CANCELLED";

export interface PurchaseOrder {
  id: string;
  number: string | null;
  storeId: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  approvalRequestId: string | null;
  issuedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  notes: string | null;
}

export interface PurchaseOrderInput {
  storeId: string;
  supplierId: string;
  notes?: string;
}

export interface PurchaseOrderItem {
  id: string;
  productVariantId: string | null;
  productComponentId: string | null;
  itemName: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
  notes: string | null;
}

export interface PurchaseOrderItemInput {
  productVariantId?: string;
  productComponentId?: string;
  quantity: number;
  unitCost: number;
  notes?: string;
}

// ── Receiving ────────────────────────────────────────────────────────────

export type PurchaseReceiptStatus = "DRAFT" | "FINALIZED";

export interface PurchaseReceipt {
  id: string;
  purchaseOrderId: string;
  status: PurchaseReceiptStatus;
  receivedAt: string | null;
  notes: string | null;
}

export interface PurchaseReceiptItem {
  id: string;
  purchaseOrderItemId: string;
  itemName: string;
  acceptedQuantity: number;
  rejectedQuantity: number;
  rejectedReason: string | null;
  notes: string | null;
}

export interface CreateReceiptInput {
  purchaseOrderId: string;
  notes?: string;
}

export interface ReceiptItemInput {
  purchaseOrderItemId: string;
  acceptedQuantity: number;
  rejectedQuantity: number;
  rejectedReason?: string;
  notes?: string;
}

// ── Supplier Payments ────────────────────────────────────────────────────

export interface SupplierPayment {
  id: string;
  purchaseOrderId: string;
  amount: number;
  paidAt: string;
  payerId: string | null;
  notes: string | null;
}

export interface SupplierPaymentInput {
  purchaseOrderId: string;
  amount: number;
  paidAt?: string;
  notes?: string;
}
