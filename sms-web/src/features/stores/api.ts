import { apiClient } from "../../lib/apiClient";
import type { Store, StoreInput } from "./types";

export const storesApi = {
  list: () => apiClient.get<Store[]>("/api/stores").then((r) => r.data),
  create: (input: StoreInput) =>
    apiClient.post<Store>("/api/stores", input).then((r) => r.data),
  update: (id: string, input: StoreInput) =>
    apiClient.put<Store>(`/api/stores/${id}`, input).then((r) => r.data),
  deactivate: (id: string) => apiClient.post(`/api/stores/${id}/deactivate`),
  activate: (id: string) => apiClient.post(`/api/stores/${id}/activate`),
};
