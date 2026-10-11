export type SalesOrderStatus =
  | "DRAFT"
  | "PENDING_PRICE_APPROVAL"
  | "REJECTED"
  | "RELEASED"
  | "SURVEY_REJECTED"
  | "CONFIRMED"
  | "CANCELLED";

export interface SalesOrder {
  id: string;
  number: string | null;
  storeId: string;
  customerId: string;
  customerName: string;
  salespersonEmployeeId: string;
  deliveryAddressId: string | null;
  deliveryAddressSnapshot: string | null;
  status: SalesOrderStatus;
  requiresPriceApproval: boolean;
  approvalRequestId: string | null;
  releasedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
}

export interface SalesOrderInput {
  storeId: string;
  customerId: string;
  deliveryAddressId?: string;
}

export interface SalesOrderItem {
  id: string;
  productVariantId: string;
  variantName: string;
  quantity: number;
  paymentTermMonths: number;
  referencePrice: number;
  finalPrice: number;
  notes: string | null;
}

export interface SalesOrderItemInput {
  productVariantId: string;
  quantity: number;
  paymentTermMonths: number;
  finalPrice: number;
}
