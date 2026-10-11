import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "./api";
import type {
  ReceiveStockUnitInput,
  StockAvailability,
  StockLocationType,
} from "./types";

const STOCK_UNITS_KEY = ["stock-units"];
const movementsKey = (id: string) => ["stock-unit-movements", id];
const componentStockKey = (storeId: string) => ["component-stock", storeId];

export function useStockUnits(params: {
  storeId?: string;
  variantId?: string;
  availability?: StockAvailability;
}) {
  return useQuery({
    queryKey: [...STOCK_UNITS_KEY, params],
    queryFn: () => inventoryApi.search(params),
  });
}

export function useStockUnitMovements(id: string | null) {
  return useQuery({
    queryKey: movementsKey(id ?? ""),
    queryFn: () => inventoryApi.movements(id as string),
    enabled: !!id,
  });
}

function useInvalidatingMutation<TVariables, TData>(
  mutationFn: (vars: TVariables) => Promise<TData>,
  keys: unknown[][],
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      keys.forEach((key) => queryClient.invalidateQueries({ queryKey: key })),
  });
}

export function useReceiveStockUnit() {
  return useInvalidatingMutation(
    (input: ReceiveStockUnitInput) => inventoryApi.receive(input),
    [STOCK_UNITS_KEY],
  );
}

export function useTransferStockUnit() {
  return useInvalidatingMutation(
    ({
      id,
      toStoreId,
      toLocationType,
      notes,
    }: {
      id: string;
      toStoreId: string;
      toLocationType: StockLocationType;
      notes?: string;
    }) => inventoryApi.transfer(id, toStoreId, toLocationType, notes),
    [STOCK_UNITS_KEY],
  );
}

export function useAdjustAvailability() {
  return useInvalidatingMutation(
    ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: StockAvailability;
      reason?: string;
    }) => inventoryApi.adjustAvailability(id, status, reason),
    [STOCK_UNITS_KEY],
  );
}

export function useComponentStock(storeId: string | null) {
  return useQuery({
    queryKey: componentStockKey(storeId ?? ""),
    queryFn: () => inventoryApi.listComponentStock(storeId as string),
    enabled: !!storeId,
  });
}

export function useAdjustComponentStock(storeId: string) {
  return useInvalidatingMutation(
    ({
      productComponentId,
      delta,
      notes,
    }: {
      productComponentId: string;
      delta: number;
      notes?: string;
    }) =>
      inventoryApi.adjustComponentStock(
        storeId,
        productComponentId,
        delta,
        notes,
      ),
    [componentStockKey(storeId)],
  );
}

const allocationsKey = (itemId: string) => ["allocations", itemId];

export function useAllocations(itemId: string | null) {
  return useQuery({
    queryKey: allocationsKey(itemId ?? ""),
    queryFn: () => inventoryApi.listAllocations(itemId as string),
    enabled: !!itemId,
  });
}

export function useAllocate(itemId: string) {
  return useInvalidatingMutation(
    (stockUnitId: string) => inventoryApi.allocate(itemId, stockUnitId),
    [allocationsKey(itemId), STOCK_UNITS_KEY],
  );
}

export function useReleaseAllocation(itemId: string) {
  return useInvalidatingMutation(
    (allocationId: string) =>
      inventoryApi.releaseAllocation(itemId, allocationId),
    [allocationsKey(itemId), STOCK_UNITS_KEY],
  );
}
