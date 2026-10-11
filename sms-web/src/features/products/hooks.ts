import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { catalogApi, productsApi } from "./api";
import type { ComponentInput, ProductInput, VariantInput } from "./types";

const PRODUCTS_KEY = ["products"];
const productKey = (id: string) => ["product", id];
const variantsKey = (id: string) => ["product-variants", id];
const componentsKey = (id: string) => ["product-components", id];

export function useProductSearch(query: string) {
  return useQuery({
    queryKey: [...PRODUCTS_KEY, query],
    queryFn: () => productsApi.search(query),
  });
}

export function useProduct(id: string | null) {
  return useQuery({
    queryKey: productKey(id ?? ""),
    queryFn: () => productsApi.get(id as string),
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

export function useCreateProduct() {
  return useInvalidatingMutation(
    (input: ProductInput) => productsApi.create(input),
    [PRODUCTS_KEY],
  );
}

export function useUpdateProduct() {
  return useInvalidatingMutation(
    ({ id, input }: { id: string; input: ProductInput }) =>
      productsApi.update(id, input),
    [PRODUCTS_KEY],
  );
}

export function useSetProductActive() {
  return useInvalidatingMutation(
    ({ id, active }: { id: string; active: boolean }) =>
      active ? productsApi.activate(id) : productsApi.deactivate(id),
    [PRODUCTS_KEY],
  );
}

export function useVariants(productId: string | null) {
  return useQuery({
    queryKey: variantsKey(productId ?? ""),
    queryFn: () => productsApi.listVariants(productId as string),
    enabled: !!productId,
  });
}

export function useAddVariant(productId: string) {
  return useInvalidatingMutation(
    (input: VariantInput) => productsApi.addVariant(productId, input),
    [variantsKey(productId)],
  );
}

export function useDeactivateVariant(productId: string) {
  return useInvalidatingMutation(
    (variantId: string) => productsApi.deactivateVariant(variantId),
    [variantsKey(productId)],
  );
}

export function useComponents(productId: string | null) {
  return useQuery({
    queryKey: componentsKey(productId ?? ""),
    queryFn: () => productsApi.listComponents(productId as string),
    enabled: !!productId,
  });
}

export function useAddComponent(productId: string) {
  return useInvalidatingMutation(
    (input: ComponentInput) => productsApi.addComponent(productId, input),
    [componentsKey(productId)],
  );
}

export function useDeactivateComponent(productId: string) {
  return useInvalidatingMutation(
    (componentId: string) => productsApi.deactivateComponent(componentId),
    [componentsKey(productId)],
  );
}

export function useCategories() {
  return useQuery({
    queryKey: ["catalog-categories"],
    queryFn: catalogApi.categories,
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ["catalog-brands"],
    queryFn: catalogApi.brands,
  });
}
