import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deliveryOrdersApi, deliveryTripsApi } from "./api";
import type {
  CompleteDeliveryOrderInput,
  CreateDeliveryOrderInput,
  CreateDeliveryTripInput,
  DeliveryOrderStatus,
  DeliveryTripStatus,
  FailDeliveryOrderInput,
  PreInspectionInput,
} from "./types";

const TRIPS_KEY = ["delivery-trips"];
const tripKey = (id: string) => ["delivery-trip", id];
const ORDERS_KEY = ["delivery-orders"];
const orderKey = (id: string) => ["delivery-order", id];
const tripOrdersKey = (tripId: string) => ["delivery-orders-trip", tripId];
const soOrdersKey = (soId: string) => ["delivery-orders-so", soId];

function useInvalidatingMutation<TVariables, TData = unknown>(
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

// ── Trip Hooks ──────────────────────────────────────────────────────────────

export function useDeliveryTrips(params?: {
  storeId?: string;
  status?: DeliveryTripStatus;
  driverId?: string;
}) {
  return useQuery({
    queryKey: [...TRIPS_KEY, params],
    queryFn: () => deliveryTripsApi.search(params),
  });
}

export function useDeliveryTrip(id: string | null) {
  return useQuery({
    queryKey: tripKey(id ?? ""),
    queryFn: () => deliveryTripsApi.get(id as string),
    enabled: !!id,
  });
}

export function useCreateDeliveryTrip() {
  return useInvalidatingMutation(
    (input: CreateDeliveryTripInput) => deliveryTripsApi.create(input),
    [TRIPS_KEY],
  );
}

export function useDispatchDeliveryTrip(tripId: string) {
  return useInvalidatingMutation(
    () => deliveryTripsApi.dispatch(tripId),
    [TRIPS_KEY, tripKey(tripId), tripOrdersKey(tripId), ORDERS_KEY],
  );
}

export function useCompleteDeliveryTrip(tripId: string) {
  return useInvalidatingMutation(
    (notes?: string) => deliveryTripsApi.complete(tripId, notes),
    [TRIPS_KEY, tripKey(tripId), tripOrdersKey(tripId), ORDERS_KEY],
  );
}

export function useCancelDeliveryTrip(tripId: string) {
  return useInvalidatingMutation(
    (reason?: string) => deliveryTripsApi.cancel(tripId, reason),
    [TRIPS_KEY, tripKey(tripId), tripOrdersKey(tripId), ORDERS_KEY],
  );
}

// ── Delivery Order Hooks ───────────────────────────────────────────────────

export function useDeliveryOrders(params?: {
  salesOrderId?: string;
  tripId?: string;
  status?: DeliveryOrderStatus;
}) {
  return useQuery({
    queryKey: [...ORDERS_KEY, params],
    queryFn: () => deliveryOrdersApi.search(params),
  });
}

export function useDeliveryOrder(id: string | null) {
  return useQuery({
    queryKey: orderKey(id ?? ""),
    queryFn: () => deliveryOrdersApi.get(id as string),
    enabled: !!id,
  });
}

export function useDeliveryOrdersByTrip(tripId: string | null) {
  return useQuery({
    queryKey: tripOrdersKey(tripId ?? ""),
    queryFn: () => deliveryOrdersApi.listByTrip(tripId as string),
    enabled: !!tripId,
  });
}

export function useDeliveryOrdersBySalesOrder(salesOrderId: string | null) {
  return useQuery({
    queryKey: soOrdersKey(salesOrderId ?? ""),
    queryFn: () => deliveryOrdersApi.listBySalesOrder(salesOrderId as string),
    enabled: !!salesOrderId,
  });
}

export function useCreateDeliveryOrder(salesOrderId?: string, tripId?: string) {
  const keys: unknown[][] = [ORDERS_KEY];
  if (salesOrderId) keys.push(soOrdersKey(salesOrderId));
  if (tripId) keys.push(tripOrdersKey(tripId));
  return useInvalidatingMutation(
    (input: CreateDeliveryOrderInput) => deliveryOrdersApi.create(input),
    keys,
  );
}

export function useRecordPreInspection(orderId: string, tripId?: string) {
  const keys: unknown[][] = [ORDERS_KEY, orderKey(orderId)];
  if (tripId) keys.push(tripOrdersKey(tripId));
  return useInvalidatingMutation(
    (input: PreInspectionInput) =>
      deliveryOrdersApi.recordPreInspection(orderId, input),
    keys,
  );
}

export function useDeliverOrder(orderId: string, tripId?: string, soId?: string) {
  const keys: unknown[][] = [ORDERS_KEY, orderKey(orderId), ["stock-units"]];
  if (tripId) keys.push(tripOrdersKey(tripId));
  if (soId) keys.push(soOrdersKey(soId));
  return useInvalidatingMutation(
    (input: CompleteDeliveryOrderInput) =>
      deliveryOrdersApi.deliver(orderId, input),
    keys,
  );
}

export function useFailOrder(orderId: string, tripId?: string, soId?: string) {
  const keys: unknown[][] = [ORDERS_KEY, orderKey(orderId)];
  if (tripId) keys.push(tripOrdersKey(tripId));
  if (soId) keys.push(soOrdersKey(soId));
  return useInvalidatingMutation(
    (input: FailDeliveryOrderInput) => deliveryOrdersApi.fail(orderId, input),
    keys,
  );
}

export function useCancelDeliveryOrder(orderId: string, tripId?: string, soId?: string) {
  const keys: unknown[][] = [ORDERS_KEY, orderKey(orderId)];
  if (tripId) keys.push(tripOrdersKey(tripId));
  if (soId) keys.push(soOrdersKey(soId));
  return useInvalidatingMutation(
    (reason?: string) => deliveryOrdersApi.cancel(orderId, reason),
    keys,
  );
}
