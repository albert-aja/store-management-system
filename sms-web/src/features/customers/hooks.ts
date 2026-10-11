import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customersApi } from "./api";
import type { AddressInput, ContactInput, CustomerInput } from "./types";

const CUSTOMERS_KEY = ["customers"];
const customerKey = (id: string) => ["customer", id];
const contactsKey = (id: string) => ["customer-contacts", id];
const addressesKey = (id: string) => ["customer-addresses", id];

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
