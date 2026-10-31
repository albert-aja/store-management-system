import { apiClient } from "../../lib/apiClient";
import type { BulkOperationResultDto } from "../salesOrders/api";
import type {
  CreateReceiptInput,
  PurchaseOrder,
  PurchaseOrderInput,
  PurchaseOrderItem,
  PurchaseOrderItemInput,
  PurchaseOrderStatus,
  PurchaseReceipt,
  PurchaseReceiptItem,
  ReceiptItemInput,
  Supplier,
  SupplierContact,
  SupplierContactInput,
  SupplierInput,
  SupplierPayment,
  SupplierPaymentInput,
} from "./types";

export const suppliersApi = {
  search: (query: string) =>
    apiClient
      .get<Supplier[]>("/api/suppliers", { params: { query } })
      .then((r) => r.data),
  get: (id: string) =>
    apiClient.get<Supplier>(`/api/suppliers/${id}`).then((r) => r.data),
  create: (input: SupplierInput) =>
    apiClient.post<Supplier>("/api/suppliers", input).then((r) => r.data),
  update: (id: string, input: SupplierInput) =>
    apiClient.put<Supplier>(`/api/suppliers/${id}`, input).then((r) => r.data),
  toggleActive: (id: string) =>
    apiClient.post<Supplier>(`/api/suppliers/${id}/toggle-active`).then((r) => r.data),

  listContacts: (supplierId: string) =>
    apiClient
      .get<SupplierContact[]>(`/api/suppliers/${supplierId}/contacts`)
      .then((r) => r.data),
  addContact: (supplierId: string, input: SupplierContactInput) =>
    apiClient
      .post<SupplierContact>(`/api/suppliers/${supplierId}/contacts`, input)
      .then((r) => r.data),
  deleteContact: (supplierId: string, contactId: string) =>
    apiClient.delete(`/api/suppliers/${supplierId}/contacts/${contactId}`),
};

export const purchaseOrdersApi = {
  search: (params: {
    storeId?: string;
    supplierId?: string;
    status?: PurchaseOrderStatus;
  }) =>
    apiClient
      .get<PurchaseOrder[]>("/api/purchase-orders", { params })
      .then((r) => r.data),
  get: (id: string) =>
    apiClient
      .get<PurchaseOrder>(`/api/purchase-orders/${id}`)
      .then((r) => r.data),
  createDraft: (input: PurchaseOrderInput) =>
    apiClient
      .post<PurchaseOrder>("/api/purchase-orders", input)
      .then((r) => r.data),
  updateHeader: (id: string, supplierId?: string, notes?: string) =>
    apiClient
      .put<PurchaseOrder>(`/api/purchase-orders/${id}`, { supplierId, notes })
      .then((r) => r.data),

  listItems: (id: string) =>
    apiClient
      .get<PurchaseOrderItem[]>(`/api/purchase-orders/${id}/items`)
      .then((r) => r.data),
  addItem: (id: string, input: PurchaseOrderItemInput) =>
    apiClient
      .post<PurchaseOrderItem>(`/api/purchase-orders/${id}/items`, input)
      .then((r) => r.data),
  removeItem: (itemId: string) =>
    apiClient.delete(`/api/purchase-orders/items/${itemId}`),

  submitForApproval: (id: string, workflowCode: string) =>
    apiClient
      .post<PurchaseOrder>(`/api/purchase-orders/${id}/submit-approval`, {
        workflowCode,
      })
      .then((r) => r.data),
  revise: (id: string) =>
    apiClient
      .post<PurchaseOrder>(`/api/purchase-orders/${id}/revise`)
      .then((r) => r.data),
  issue: (id: string) =>
    apiClient
      .post<PurchaseOrder>(`/api/purchase-orders/${id}/issue`)
      .then((r) => r.data),
  cancel: (id: string, reason?: string) =>
    apiClient
      .post<PurchaseOrder>(`/api/purchase-orders/${id}/cancel`, { reason })
      .then((r) => r.data),
  bulkUpdateStatus: (input: { ids: string[]; action: string; reason?: string }) =>
    apiClient
      .post<BulkOperationResultDto>("/api/purchase-orders/bulk-status", input)
      .then((r) => r.data),
};

export const purchaseReceiptsApi = {
  listByPo: (purchaseOrderId: string) =>
    apiClient
      .get<PurchaseReceipt[]>("/api/purchase-receipts", {
        params: { purchaseOrderId },
      })
      .then((r) => r.data),
  get: (id: string) =>
    apiClient
      .get<PurchaseReceipt>(`/api/purchase-receipts/${id}`)
      .then((r) => r.data),
  listItems: (id: string) =>
    apiClient
      .get<PurchaseReceiptItem[]>(`/api/purchase-receipts/${id}/items`)
      .then((r) => r.data),
  create: (input: CreateReceiptInput) =>
    apiClient
      .post<PurchaseReceipt>("/api/purchase-receipts", input)
      .then((r) => r.data),
  upsertItem: (id: string, input: ReceiptItemInput) =>
    apiClient
      .put<PurchaseReceiptItem>(`/api/purchase-receipts/${id}/items`, input)
      .then((r) => r.data),
  finalize: (id: string) =>
    apiClient
      .post<PurchaseReceipt>(`/api/purchase-receipts/${id}/finalize`)
      .then((r) => r.data),
};

export const supplierPaymentsApi = {
  listByPo: (purchaseOrderId: string) =>
    apiClient
      .get<SupplierPayment[]>("/api/supplier-payments", {
        params: { purchaseOrderId },
      })
      .then((r) => r.data),
  totalPaid: (purchaseOrderId: string) =>
    apiClient
      .get<number>("/api/supplier-payments/total", {
        params: { purchaseOrderId },
      })
      .then((r) => r.data),
  record: (input: SupplierPaymentInput) =>
    apiClient
      .post<SupplierPayment>("/api/supplier-payments", input)
      .then((r) => r.data),
};
