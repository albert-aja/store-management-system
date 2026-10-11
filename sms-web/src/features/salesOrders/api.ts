import { apiClient } from "../../lib/apiClient";
import type {
  SalesOrder,
  SalesOrderInput,
  SalesOrderItem,
  SalesOrderItemInput,
  SalesOrderStatus,
} from "./types";

export const salesOrdersApi = {
  search: (params: {
    storeId?: string;
    customerId?: string;
    status?: SalesOrderStatus;
  }) =>
    apiClient
      .get<SalesOrder[]>("/api/sales-orders", { params })
      .then((r) => r.data),
  get: (id: string) =>
    apiClient.get<SalesOrder>(`/api/sales-orders/${id}`).then((r) => r.data),
  createDraft: (input: SalesOrderInput) =>
    apiClient.post<SalesOrder>("/api/sales-orders", input).then((r) => r.data),
  updateHeader: (id: string, customerId: string, deliveryAddressId?: string) =>
    apiClient
      .put<SalesOrder>(`/api/sales-orders/${id}`, {
        customerId,
        deliveryAddressId,
      })
      .then((r) => r.data),

  listItems: (id: string) =>
    apiClient
      .get<SalesOrderItem[]>(`/api/sales-orders/${id}/items`)
      .then((r) => r.data),
  addItem: (id: string, input: SalesOrderItemInput) =>
    apiClient
      .post<SalesOrderItem>(`/api/sales-orders/${id}/items`, input)
      .then((r) => r.data),
  removeItem: (itemId: string) =>
    apiClient.delete(`/api/sales-orders/items/${itemId}`),

  submitForPriceApproval: (id: string, workflowCode: string) =>
    apiClient
      .post<SalesOrder>(`/api/sales-orders/${id}/submit-price-approval`, {
        workflowCode,
      })
      .then((r) => r.data),
  revise: (id: string) =>
    apiClient
      .post<SalesOrder>(`/api/sales-orders/${id}/revise`)
      .then((r) => r.data),
  release: (id: string) =>
    apiClient
      .post<SalesOrder>(`/api/sales-orders/${id}/release`)
      .then((r) => r.data),
  confirm: (id: string, dpReceived: boolean) =>
    apiClient
      .post<SalesOrder>(`/api/sales-orders/${id}/confirm`, { dpReceived })
      .then((r) => r.data),
  cancel: (id: string, reason?: string) =>
    apiClient
      .post<SalesOrder>(`/api/sales-orders/${id}/cancel`, { reason })
      .then((r) => r.data),
};
