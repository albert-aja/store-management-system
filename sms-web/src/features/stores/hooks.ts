import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { storesApi } from "./api";
import type { StoreInput } from "./types";

const STORES_KEY = ["stores"];

export function useStores() {
  return useQuery({ queryKey: STORES_KEY, queryFn: storesApi.list });
}

export function useCreateStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: StoreInput) => storesApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STORES_KEY }),
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: StoreInput }) =>
      storesApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STORES_KEY }),
  });
}

export function useSetStoreActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? storesApi.activate(id) : storesApi.deactivate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STORES_KEY }),
  });
}
