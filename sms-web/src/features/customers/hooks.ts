import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customersApi } from "./api";
import type {
  AddressInput,
  ContactInput,
  CustomerInput,
  DuplicateCheckInput,
  FollowUpInput,
  InteractionInput,
  PtpInput,
  StoreCreditInput,
} from "./types";

const CUSTOMERS_KEY = ["customers"];
const customerKey = (id: string) => ["customer", id];
const customer360Key = (id: string) => ["customer-360", id];
const contactsKey = (id: string) => ["customer-contacts", id];
const addressesKey = (id: string) => ["customer-addresses", id];
const interactionsKey = (id: string) => ["customer-interactions", id];
const followUpsKey = (id: string) => ["customer-follow-ups", id];
const ptpKey = (id: string) => ["customer-ptps", id];
const storeCreditKey = (id: string) => ["customer-store-credit", id];
const vouchersKey = (id: string) => ["customer-vouchers", id];
const tagsKey = (id: string) => ["customer-tags", id];

export function useCustomerSearch(query: string) {
  return useQuery({
    queryKey: [...CUSTOMERS_KEY, query],
    queryFn: () => customersApi.search(query),
  });
}

export function useCustomers(query = "") {
  return useQuery({
    queryKey: [...CUSTOMERS_KEY, query],
    queryFn: () => customersApi.search(query),
  });
}

export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: customerKey(id ?? ""),
    queryFn: () => customersApi.get(id as string),
    enabled: !!id,
  });
}

function useInvalidatingMutation<TVariables>(
  mutationFn: (vars: TVariables) => Promise<unknown>,
  keys: unknown[][],
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      keys.forEach((key) => queryClient.invalidateQueries({ queryKey: key })),
  });
}

export function useCreateCustomer() {
  return useInvalidatingMutation(
    (input: CustomerInput) => customersApi.create(input),
    [CUSTOMERS_KEY],
  );
}

export function useUpdateCustomer() {
  return useInvalidatingMutation(
    ({ id, input }: { id: string; input: CustomerInput }) =>
      customersApi.update(id, input),
    [CUSTOMERS_KEY],
  );
}

export function useSetCustomerActive() {
  return useInvalidatingMutation(
    ({ id, active }: { id: string; active: boolean }) =>
      active ? customersApi.activate(id) : customersApi.deactivate(id),
    [CUSTOMERS_KEY],
  );
}

export function useCustomerContacts(customerId: string | null) {
  return useQuery({
    queryKey: contactsKey(customerId ?? ""),
    queryFn: () => customersApi.listContacts(customerId as string),
    enabled: !!customerId,
  });
}

export function useAddContact(customerId: string) {
  return useInvalidatingMutation(
    (input: ContactInput) => customersApi.addContact(customerId, input),
    [contactsKey(customerId)],
  );
}

export function useDeactivateContact(customerId: string) {
  return useInvalidatingMutation(
    (contactId: string) => customersApi.deactivateContact(contactId),
    [contactsKey(customerId)],
  );
}

export function useCustomerAddresses(customerId: string | null) {
  return useQuery({
    queryKey: addressesKey(customerId ?? ""),
    queryFn: () => customersApi.listAddresses(customerId as string),
    enabled: !!customerId,
  });
}

export function useAddAddress(customerId: string) {
  return useInvalidatingMutation(
    (input: AddressInput) => customersApi.addAddress(customerId, input),
    [addressesKey(customerId)],
  );
}

export function useSetPrimaryAddress(customerId: string) {
  return useInvalidatingMutation(
    (addressId: string) =>
      customersApi.setPrimaryAddress(customerId, addressId),
    [addressesKey(customerId)],
  );
}

export function useDeactivateAddress(customerId: string) {
  return useInvalidatingMutation(
    (addressId: string) => customersApi.deactivateAddress(addressId),
    [addressesKey(customerId)],
  );
}

// --- CRM & Customer 360 Hooks (J.1 - J.7) ---

export function useCustomer360(customerId: string | null) {
  return useQuery({
    queryKey: customer360Key(customerId ?? ""),
    queryFn: () => customersApi.getCustomer360(customerId as string),
    enabled: !!customerId,
  });
}

export function useCustomerTags(customerId: string | null) {
  return useQuery({
    queryKey: tagsKey(customerId ?? ""),
    queryFn: () => customersApi.listTags(customerId as string),
    enabled: !!customerId,
  });
}

export function useAddCustomerTag(customerId: string) {
  return useInvalidatingMutation(
    ({ tagName, color }: { tagName: string; color?: string }) =>
      customersApi.addTag(customerId, tagName, color),
    [tagsKey(customerId), customer360Key(customerId)],
  );
}

export function useRemoveCustomerTag(customerId: string) {
  return useInvalidatingMutation(
    (tagName: string) => customersApi.removeTag(customerId, tagName),
    [tagsKey(customerId), customer360Key(customerId)],
  );
}

export function useCustomerInteractions(customerId: string | null) {
  return useQuery({
    queryKey: interactionsKey(customerId ?? ""),
    queryFn: () => customersApi.listInteractions(customerId as string),
    enabled: !!customerId,
  });
}

export function useLogCustomerInteraction(customerId: string) {
  return useInvalidatingMutation(
    (input: InteractionInput) => customersApi.logInteraction(customerId, input),
    [interactionsKey(customerId), customer360Key(customerId)],
  );
}

export function useCustomerFollowUps(customerId: string | null) {
  return useQuery({
    queryKey: followUpsKey(customerId ?? ""),
    queryFn: () => customersApi.listFollowUps(customerId as string),
    enabled: !!customerId,
  });
}

export function useCreateCustomerFollowUp(customerId: string) {
  return useInvalidatingMutation(
    (input: FollowUpInput) => customersApi.createFollowUp(customerId, input),
    [followUpsKey(customerId), customer360Key(customerId)],
  );
}

export function useCompleteCustomerFollowUp(customerId: string) {
  return useInvalidatingMutation(
    ({ followUpId, notes }: { followUpId: string; notes?: string }) =>
      customersApi.completeFollowUp(followUpId, notes),
    [followUpsKey(customerId), customer360Key(customerId)],
  );
}

export function useCancelCustomerFollowUp(customerId: string) {
  return useInvalidatingMutation(
    (followUpId: string) => customersApi.cancelFollowUp(followUpId),
    [followUpsKey(customerId), customer360Key(customerId)],
  );
}

export function useCustomerPtps(customerId: string | null) {
  return useQuery({
    queryKey: ptpKey(customerId ?? ""),
    queryFn: () => customersApi.listPtps(customerId as string),
    enabled: !!customerId,
  });
}

export function useRecordCustomerPtp(customerId: string) {
  return useInvalidatingMutation(
    (input: PtpInput) => customersApi.recordPtp(customerId, input),
    [ptpKey(customerId), customer360Key(customerId)],
  );
}

export function useUpdateCustomerPtpStatus(customerId: string) {
  return useInvalidatingMutation(
    ({
      ptpId,
      status,
      notes,
    }: {
      ptpId: string;
      status: string;
      notes?: string;
    }) => customersApi.updatePtpStatus(ptpId, status, notes),
    [ptpKey(customerId), customer360Key(customerId)],
  );
}

export function useCustomerStoreCredit(customerId: string | null) {
  return useQuery({
    queryKey: storeCreditKey(customerId ?? ""),
    queryFn: () => customersApi.listStoreCredit(customerId as string),
    enabled: !!customerId,
  });
}

export function useGrantCustomerStoreCredit(customerId: string) {
  return useInvalidatingMutation(
    (input: StoreCreditInput) => customersApi.grantStoreCredit(customerId, input),
    [storeCreditKey(customerId), customer360Key(customerId)],
  );
}

export function useRedeemCustomerStoreCredit(customerId: string) {
  return useInvalidatingMutation(
    (input: StoreCreditInput) =>
      customersApi.redeemStoreCredit(customerId, input),
    [storeCreditKey(customerId), customer360Key(customerId)],
  );
}

export function useCustomerVouchers(customerId: string | null) {
  return useQuery({
    queryKey: vouchersKey(customerId ?? ""),
    queryFn: () => customersApi.listCustomerVouchers(customerId as string),
    enabled: !!customerId,
  });
}

export function useCheckFuzzyDuplicate() {
  return useMutation({
    mutationFn: (input: DuplicateCheckInput) => customersApi.checkDuplicate(input),
  });
}
