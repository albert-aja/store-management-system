import { apiClient } from "../../lib/apiClient";
import type {
  AddressInput,
  ContactInput,
  Customer,
  Customer360Summary,
  CustomerAddress,
  CustomerContact,
  CustomerFollowUpItem,
  CustomerInput,
  CustomerInteractionItem,
  CustomerPromiseToPayItem,
  CustomerTagItem,
  DuplicateCheckInput,
  DuplicateMatchResultItem,
  FollowUpInput,
  InteractionInput,
  PtpInput,
  StoreCreditEntryItem,
  StoreCreditInput,
  StoreVoucherItem,
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

  // --- CRM / Customer 360 (J.1 - J.7) ---
  getCustomer360: (id: string) =>
    apiClient
      .get<Customer360Summary>(`/api/customers/${id}/360`)
      .then((r) => r.data),

  listTags: (id: string) =>
    apiClient
      .get<CustomerTagItem[]>(`/api/customers/${id}/tags`)
      .then((r) => r.data),
  addTag: (id: string, tagName: string, color?: string) =>
    apiClient
      .post<CustomerTagItem>(`/api/customers/${id}/tags`, { tagName, color })
      .then((r) => r.data),
  removeTag: (id: string, tagName: string) =>
    apiClient.delete(`/api/customers/${id}/tags/${encodeURIComponent(tagName)}`),

  listInteractions: (id: string) =>
    apiClient
      .get<CustomerInteractionItem[]>(`/api/customers/${id}/interactions`)
      .then((r) => r.data),
  logInteraction: (id: string, input: InteractionInput) =>
    apiClient
      .post<CustomerInteractionItem>(`/api/customers/${id}/interactions`, input)
      .then((r) => r.data),

  listFollowUps: (id: string) =>
    apiClient
      .get<CustomerFollowUpItem[]>(`/api/customers/${id}/follow-ups`)
      .then((r) => r.data),
  createFollowUp: (id: string, input: FollowUpInput) =>
    apiClient
      .post<CustomerFollowUpItem>(`/api/customers/${id}/follow-ups`, input)
      .then((r) => r.data),
  completeFollowUp: (followUpId: string, notes?: string) =>
    apiClient
      .post<CustomerFollowUpItem>(
        `/api/customers/crm/follow-ups/${followUpId}/complete`,
        null,
        { params: { notes } }
      )
      .then((r) => r.data),
  cancelFollowUp: (followUpId: string) =>
    apiClient
      .post<CustomerFollowUpItem>(`/api/customers/crm/follow-ups/${followUpId}/cancel`)
      .then((r) => r.data),

  listPtps: (id: string) =>
    apiClient
      .get<CustomerPromiseToPayItem[]>(`/api/customers/${id}/promise-to-pay`)
      .then((r) => r.data),
  recordPtp: (id: string, input: PtpInput) =>
    apiClient
      .post<CustomerPromiseToPayItem>(`/api/customers/${id}/promise-to-pay`, input)
      .then((r) => r.data),
  updatePtpStatus: (ptpId: string, status: string, notes?: string) =>
    apiClient
      .post<CustomerPromiseToPayItem>(`/api/customers/crm/promise-to-pay/${ptpId}/status`, {
        status,
        notes,
      })
      .then((r) => r.data),

  listStoreCredit: (id: string) =>
    apiClient
      .get<StoreCreditEntryItem[]>(`/api/customers/${id}/store-credit`)
      .then((r) => r.data),
  grantStoreCredit: (id: string, input: StoreCreditInput) =>
    apiClient
      .post<StoreCreditEntryItem>(`/api/customers/${id}/store-credit/grant`, input)
      .then((r) => r.data),
  redeemStoreCredit: (id: string, input: StoreCreditInput) =>
    apiClient
      .post<StoreCreditEntryItem>(`/api/customers/${id}/store-credit/redeem`, input)
      .then((r) => r.data),

  listCustomerVouchers: (id: string) =>
    apiClient
      .get<StoreVoucherItem[]>(`/api/vouchers/customer/${id}`)
      .then((r) => r.data),

  checkDuplicate: (input: DuplicateCheckInput) =>
    apiClient
      .post<DuplicateMatchResultItem[]>("/api/customers/crm/check-duplicate", input)
      .then((r) => r.data),
};
