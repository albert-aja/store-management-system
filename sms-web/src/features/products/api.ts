import { apiClient } from "../../lib/apiClient";
import type {
  Brand,
  Category,
  ComponentInput,
  Product,
  ProductComponent,
  ProductInput,
  ProductVariant,
  VariantInput,
} from "./types";

export const catalogApi = {
  categories: () =>
    apiClient.get<Category[]>("/api/catalog/categories").then((r) => r.data),
  brands: () =>
    apiClient.get<Brand[]>("/api/catalog/brands").then((r) => r.data),
};

export const productsApi = {
  search: (query: string) =>
    apiClient
      .get<Product[]>("/api/products", { params: { query } })
      .then((r) => r.data),
  get: (id: string) =>
    apiClient.get<Product>(`/api/products/${id}`).then((r) => r.data),
  create: (input: ProductInput) =>
    apiClient.post<Product>("/api/products", input).then((r) => r.data),
  update: (id: string, input: ProductInput) =>
    apiClient.put<Product>(`/api/products/${id}`, input).then((r) => r.data),
  deactivate: (id: string) => apiClient.post(`/api/products/${id}/deactivate`),
  activate: (id: string) => apiClient.post(`/api/products/${id}/activate`),

  listVariants: (id: string) =>
    apiClient
      .get<ProductVariant[]>(`/api/products/${id}/variants`)
      .then((r) => r.data),
  addVariant: (id: string, input: VariantInput) =>
    apiClient
      .post<ProductVariant>(`/api/products/${id}/variants`, input)
      .then((r) => r.data),
  deactivateVariant: (variantId: string) =>
    apiClient.post(`/api/products/variants/${variantId}/deactivate`),

  listComponents: (id: string) =>
    apiClient
      .get<ProductComponent[]>(`/api/products/${id}/components`)
      .then((r) => r.data),
  addComponent: (id: string, input: ComponentInput) =>
    apiClient
      .post<ProductComponent>(`/api/products/${id}/components`, input)
      .then((r) => r.data),
  deactivateComponent: (componentId: string) =>
    apiClient.post(`/api/products/components/${componentId}/deactivate`),
};
