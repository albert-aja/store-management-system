import { apiClient } from "../../lib/apiClient";
import type {
  Allocation,
  ComponentStock,
  ReceiveStockUnitInput,
  StockAvailability,
  StockLocationType,
  StockMovement,
  StockUnit,
} from "./types";

export const inventoryApi = {
  search: (params: {
    storeId?: string;
    variantId?: string;
    availability?: StockAvailability;
  }) =>
    apiClient
      .get<StockUnit[]>("/api/stock-units", { params })
      .then((r) => r.data),
  receive: (input: ReceiveStockUnitInput) =>
    apiClient.post<StockUnit>("/api/stock-units", input).then((r) => r.data),
  transfer: (
    id: string,
    toStoreId: string,
    toLocationType: StockLocationType,
    notes?: string,
  ) =>
    apiClient
      .post<StockUnit>(`/api/stock-units/${id}/transfer`, {
        toStoreId,
        toLocationType,
        notes,
      })
      .then((r) => r.data),
  adjustAvailability: (
    id: string,
    status: StockAvailability,
    reason?: string,
  ) =>
    apiClient
      .put<StockUnit>(`/api/stock-units/${id}/availability`, { status, reason })
      .then((r) => r.data),
  movements: (id: string) =>
    apiClient
      .get<StockMovement[]>(`/api/stock-units/${id}/movements`)
      .then((r) => r.data),

  listComponentStock: (storeId: string) =>
    apiClient
      .get<ComponentStock[]>(`/api/stores/${storeId}/component-stock`)
      .then((r) => r.data),
  adjustComponentStock: (
    storeId: string,
    productComponentId: string,
    delta: number,
    notes?: string,
  ) =>
    apiClient
      .post<ComponentStock>(`/api/stores/${storeId}/component-stock/adjust`, {
        productComponentId,
        delta,
        notes,
      })
      .then((r) => r.data),

  listAllocations: (itemId: string) =>
    apiClient
      .get<Allocation[]>(`/api/sales-order-items/${itemId}/allocations`)
      .then((r) => r.data),
  allocate: (itemId: string, stockUnitId: string) =>
    apiClient
      .post<Allocation>(`/api/sales-order-items/${itemId}/allocations`, {
        stockUnitId,
      })
      .then((r) => r.data),
  releaseAllocation: (itemId: string, allocationId: string) =>
    apiClient.post(
      `/api/sales-order-items/${itemId}/allocations/${allocationId}/release`,
    ),
};
