import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { salesOrdersApi } from "./api";
import type {
  SalesOrderInput,
  SalesOrderItemInput,
  SalesOrderStatus,
} from "./types";

const SALES_ORDERS_KEY = ["sales-orders"];
const salesOrderKey = (id: string) => ["sales-order", id];
const itemsKey = (id: string) => ["sales-order-items", id];

export function useSalesOrders(params: {
  storeId?: string;
  customerId?: string;
  status?: SalesOrderStatus;
}) {
  return useQuery({
    queryKey: [...SALES_ORDERS_KEY, params],
    queryFn: () => salesOrdersApi.search(params),
  });
}

export function useSalesOrder(id: string | null) {
  return useQuery({
    queryKey: salesOrderKey(id ?? ""),
    queryFn: () => salesOrdersApi.get(id as string),
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

export function useCreateDraft() {
  return useInvalidatingMutation(
    (input: SalesOrderInput) => salesOrdersApi.createDraft(input),
    [SALES_ORDERS_KEY],
  );
}

export function useSalesOrderItems(id: string | null) {
  return useQuery({
    queryKey: itemsKey(id ?? ""),
    queryFn: () => salesOrdersApi.listItems(id as string),
    enabled: !!id,
  });
}

export function useAddItem(id: string) {
  return useInvalidatingMutation(
    (input: SalesOrderItemInput) => salesOrdersApi.addItem(id, input),
    [itemsKey(id), salesOrderKey(id)],
  );
}

export function useRemoveItem(id: string) {
  return useInvalidatingMutation(
    (itemId: string) => salesOrdersApi.removeItem(itemId),
    [itemsKey(id), salesOrderKey(id)],
  );
}

export function useSubmitForPriceApproval(id: string) {
  return useInvalidatingMutation(
    (workflowCode: string) =>
      salesOrdersApi.submitForPriceApproval(id, workflowCode),
    [salesOrderKey(id), SALES_ORDERS_KEY],
  );
}

export function useReviseSalesOrder(id: string) {
  return useInvalidatingMutation(
    () => salesOrdersApi.revise(id),
    [salesOrderKey(id), SALES_ORDERS_KEY],
  );
}

export function useReleaseSalesOrder(id: string) {
  return useInvalidatingMutation(
    () => salesOrdersApi.release(id),
    [salesOrderKey(id), SALES_ORDERS_KEY],
  );
}

export function useConfirmSalesOrder(id: string) {
  return useInvalidatingMutation(
    (dpReceived: boolean) => salesOrdersApi.confirm(id, dpReceived),
    [salesOrderKey(id), SALES_ORDERS_KEY],
  );
}

export function useCancelSalesOrder(id: string) {
  return useInvalidatingMutation(
    (reason: string | undefined) => salesOrdersApi.cancel(id, reason),
    [salesOrderKey(id), SALES_ORDERS_KEY],
  );
}
