import { apiClient } from "../../lib/apiClient";
import type {
  CompleteDeliveryOrderInput,
  CreateDeliveryOrderInput,
  CreateDeliveryTripInput,
  DeliveryOrder,
  DeliveryOrderStatus,
  DeliveryTrip,
  DeliveryTripStatus,
  FailDeliveryOrderInput,
  PreInspectionInput,
} from "./types";

export const deliveryTripsApi = {
  search: (params?: {
    storeId?: string;
    status?: DeliveryTripStatus;
    driverId?: string;
  }) =>
    apiClient
      .get<DeliveryTrip[]>("/api/delivery-trips", { params })
      .then((r) => r.data),

  get: (id: string) =>
    apiClient.get<DeliveryTrip>(`/api/delivery-trips/${id}`).then((r) => r.data),

  create: (input: CreateDeliveryTripInput) =>
    apiClient.post<DeliveryTrip>("/api/delivery-trips", input).then((r) => r.data),

  dispatch: (id: string) =>
    apiClient
      .post<DeliveryTrip>(`/api/delivery-trips/${id}/dispatch`)
      .then((r) => r.data),

  complete: (id: string, notes?: string) =>
    apiClient
      .post<DeliveryTrip>(`/api/delivery-trips/${id}/complete`, notes, {
        headers: { "Content-Type": "text/plain" },
      })
      .then((r) => r.data),

  cancel: (id: string, reason?: string) =>
    apiClient
      .post<DeliveryTrip>(`/api/delivery-trips/${id}/cancel`, reason, {
        headers: { "Content-Type": "text/plain" },
      })
      .then((r) => r.data),
};

export const deliveryOrdersApi = {
  search: (params?: {
    salesOrderId?: string;
    tripId?: string;
    status?: DeliveryOrderStatus;
  }) =>
    apiClient
      .get<DeliveryOrder[]>("/api/delivery-orders", { params })
      .then((r) => r.data),

  get: (id: string) =>
    apiClient.get<DeliveryOrder>(`/api/delivery-orders/${id}`).then((r) => r.data),

  listByTrip: (tripId: string) =>
    apiClient
      .get<DeliveryOrder[]>(`/api/delivery-orders/by-trip/${tripId}`)
      .then((r) => r.data),

  listBySalesOrder: (salesOrderId: string) =>
    apiClient
      .get<DeliveryOrder[]>(`/api/delivery-orders/by-sales-order/${salesOrderId}`)
      .then((r) => r.data),

  create: (input: CreateDeliveryOrderInput) =>
    apiClient
      .post<DeliveryOrder>("/api/delivery-orders", input)
      .then((r) => r.data),

  recordPreInspection: (id: string, input: PreInspectionInput) =>
    apiClient
      .put<DeliveryOrder>(`/api/delivery-orders/${id}/pre-inspection`, input)
      .then((r) => r.data),

  deliver: (id: string, input: CompleteDeliveryOrderInput) =>
    apiClient
      .post<DeliveryOrder>(`/api/delivery-orders/${id}/deliver`, input)
      .then((r) => r.data),

  fail: (id: string, input: FailDeliveryOrderInput) =>
    apiClient
      .post<DeliveryOrder>(`/api/delivery-orders/${id}/fail`, input)
      .then((r) => r.data),

  cancel: (id: string, reason?: string) =>
    apiClient
      .post<DeliveryOrder>(`/api/delivery-orders/${id}/cancel`, reason, {
        headers: { "Content-Type": "text/plain" },
      })
      .then((r) => r.data),
};
