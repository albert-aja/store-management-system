import { apiClient } from "../../lib/apiClient";
import type {
  AddressInput,
  ContactInput,
  Customer,
  CustomerAddress,
  CustomerContact,
  CustomerInput,
} from "./types";

export const customersApi = {
  search: (query: string) =>
    apiClient
      .get<Customer[]>("/api/customers", { params: { query } })
      .then((r) => r.data),
  get: (id: string) =>
    apiClient.get<Customer>(`/api/customers/${id}`).then((r) => r.data),
  create: (input: CustomerInput) =>
    apiClient.post<Customer>("/api/customers", input).then((r) => r.data),
  update: (id: string, input: CustomerInput) =>
    apiClient.put<Customer>(`/api/customers/${id}`, input).then((r) => r.data),
  deactivate: (id: string) => apiClient.post(`/api/customers/${id}/deactivate`),
  activate: (id: string) => apiClient.post(`/api/customers/${id}/activate`),

  listContacts: (id: string) =>
    apiClient
      .get<CustomerContact[]>(`/api/customers/${id}/contacts`)
      .then((r) => r.data),
  addContact: (id: string, input: ContactInput) =>
    apiClient
      .post<CustomerContact>(`/api/customers/${id}/contacts`, input)
      .then((r) => r.data),
  deactivateContact: (contactId: string) =>
    apiClient.post(`/api/customers/contacts/${contactId}/deactivate`),

  listAddresses: (id: string) =>
    apiClient
      .get<CustomerAddress[]>(`/api/customers/${id}/addresses`)
      .then((r) => r.data),
  addAddress: (id: string, input: AddressInput) =>
    apiClient
      .post<CustomerAddress>(`/api/customers/${id}/addresses`, input)
      .then((r) => r.data),
  setPrimaryAddress: (customerId: string, addressId: string) =>
    apiClient.post(`/api/customers/addresses/${addressId}/set-primary`, null, {
      params: { customerId },
    }),
  deactivateAddress: (addressId: string) =>
    apiClient.post(`/api/customers/addresses/${addressId}/deactivate`),
};
