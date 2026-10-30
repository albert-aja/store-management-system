import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "./api";
import type {
  ReceiveStockUnitInput,
  StockAvailability,
  StockLocationType,
  StockUnit,
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: StockAvailability;
      reason?: string;
    }) => inventoryApi.adjustAvailability(id, status, reason),
    // Optimistic Update: instantly update matching stock unit in cache
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: STOCK_UNITS_KEY });
      const previousQueries = queryClient.getQueriesData<StockUnit[]>({
        queryKey: STOCK_UNITS_KEY,
      });

      queryClient.setQueriesData<StockUnit[]>(
        { queryKey: STOCK_UNITS_KEY },
        (old) =>
          old
            ? old.map((unit) =>
                unit.id === id ? { ...unit, availabilityStatus: status } : unit,
              )
            : [],
      );

      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      // Rollback on network failure
      if (context?.previousQueries) {
        context.previousQueries.forEach(([key, oldData]) => {
          queryClient.setQueryData(key, oldData);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: STOCK_UNITS_KEY });
    },
  });
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

export function useAllocations(soItemId: string | null) {
  return useQuery({
    queryKey: ["allocations", soItemId],
    queryFn: () => inventoryApi.listAllocations(soItemId as string),
    enabled: !!soItemId,
  });
}

export function useAllocate(soItemId: string) {
  return useInvalidatingMutation(
    (stockUnitId: string) => inventoryApi.allocate(soItemId, stockUnitId),
    [["allocations", soItemId], STOCK_UNITS_KEY],
  );
}

export function useReleaseAllocation(soItemId: string) {
  return useInvalidatingMutation(
    (allocationId: string) =>
      inventoryApi.releaseAllocation(soItemId, allocationId),
    [["allocations", soItemId], STOCK_UNITS_KEY],
  );
}
