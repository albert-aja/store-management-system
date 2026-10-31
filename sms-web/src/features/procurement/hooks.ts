import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  purchaseOrdersApi,
  purchaseReceiptsApi,
  suppliersApi,
  supplierPaymentsApi,
} from "./api";
import type {
  CreateReceiptInput,
  PurchaseOrderInput,
  PurchaseOrderItemInput,
  PurchaseOrderStatus,
  ReceiptItemInput,
  SupplierContactInput,
  SupplierInput,
  SupplierPaymentInput,
} from "./types";

const SUPPLIERS_KEY = ["suppliers"];
const supplierKey = (id: string) => ["supplier", id];
const contactsKey = (id: string) => ["supplier-contacts", id];
const POS_KEY = ["purchase-orders"];
const poKey = (id: string) => ["purchase-order", id];
const poItemsKey = (id: string) => ["purchase-order-items", id];

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

export function useSupplierSearch(query: string) {
  return useQuery({
    queryKey: [...SUPPLIERS_KEY, query],
    queryFn: () => suppliersApi.search(query),
  });
}

export function useSupplier(id: string | null) {
  return useQuery({
    queryKey: supplierKey(id ?? ""),
    queryFn: () => suppliersApi.get(id as string),
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  return useInvalidatingMutation(
    (input: SupplierInput) => suppliersApi.create(input),
    [SUPPLIERS_KEY],
  );
}

export function useUpdateSupplier() {
  return useInvalidatingMutation(
    ({ id, input }: { id: string; input: SupplierInput }) =>
      suppliersApi.update(id, input),
    [SUPPLIERS_KEY, ["supplier"]],
  );
}

export function useSetSupplierActive() {
  return useInvalidatingMutation(
    ({ id }: { id: string; active?: boolean }) =>
      suppliersApi.toggleActive(id),
    [SUPPLIERS_KEY],
  );
}

export function useSupplierContacts(id: string | null) {
  return useQuery({
    queryKey: contactsKey(id ?? ""),
    queryFn: () => suppliersApi.listContacts(id as string),
    enabled: !!id,
  });
}

export function useAddSupplierContact(id: string) {
  return useInvalidatingMutation(
    (input: SupplierContactInput) => suppliersApi.addContact(id, input),
    [contactsKey(id)],
  );
}

export function useDeactivateSupplierContact(supplierId: string) {
  return useInvalidatingMutation(
    (contactId: string) => suppliersApi.deleteContact(supplierId, contactId),
    [contactsKey(supplierId)],
  );
}

export function usePurchaseOrders(params: {
  storeId?: string;
  supplierId?: string;
  status?: PurchaseOrderStatus;
}) {
  return useQuery({
    queryKey: [...POS_KEY, params],
    queryFn: () => purchaseOrdersApi.search(params),
  });
}

export function usePurchaseOrder(id: string | null) {
  return useQuery({
    queryKey: poKey(id ?? ""),
    queryFn: () => purchaseOrdersApi.get(id as string),
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  return useInvalidatingMutation(
    (input: PurchaseOrderInput) => purchaseOrdersApi.createDraft(input),
    [POS_KEY],
  );
}

export function usePurchaseOrderItems(id: string | null) {
  return useQuery({
    queryKey: poItemsKey(id ?? ""),
    queryFn: () => purchaseOrdersApi.listItems(id as string),
    enabled: !!id,
  });
}

export function useAddPurchaseOrderItem(id: string) {
  return useInvalidatingMutation(
    (input: PurchaseOrderItemInput) => purchaseOrdersApi.addItem(id, input),
    [poItemsKey(id)],
  );
}

export function useRemovePurchaseOrderItem(id: string) {
  return useInvalidatingMutation(
    (itemId: string) => purchaseOrdersApi.removeItem(itemId),
    [poItemsKey(id)],
  );
}

export function useSubmitPurchaseOrder(id: string) {
  return useInvalidatingMutation(
    (workflowCode: string) =>
      purchaseOrdersApi.submitForApproval(id, workflowCode),
    [poKey(id), POS_KEY],
  );
}

export function useRevisePurchaseOrder(id: string) {
  return useInvalidatingMutation(
    () => purchaseOrdersApi.revise(id),
    [poKey(id), POS_KEY],
  );
}

export function useIssuePurchaseOrder(id: string) {
  return useInvalidatingMutation(
    () => purchaseOrdersApi.issue(id),
    [poKey(id), POS_KEY],
  );
}

export function useCancelPurchaseOrder(id: string) {
  return useInvalidatingMutation(
    (reason: string | undefined) => purchaseOrdersApi.cancel(id, reason),
    [poKey(id), POS_KEY],
  );
}

export function useBulkUpdatePurchaseOrders() {
  return useInvalidatingMutation(
    (input: { ids: string[]; action: string; reason?: string }) =>
      purchaseOrdersApi.bulkUpdateStatus(input),
    [POS_KEY],
  );
}

// ── Receiving ─────────────────────────────────────────────────────────────

const receiptsKey = (poId: string) => ["purchase-receipts", poId];
const receiptKey = (id: string) => ["purchase-receipt", id];
const receiptItemsKey = (id: string) => ["purchase-receipt-items", id];

export function usePurchaseReceipts(purchaseOrderId: string | null) {
  return useQuery({
    queryKey: receiptsKey(purchaseOrderId ?? ""),
    queryFn: () => purchaseReceiptsApi.listByPo(purchaseOrderId as string),
    enabled: !!purchaseOrderId,
  });
}

export function usePurchaseReceiptItems(receiptId: string | null) {
  return useQuery({
    queryKey: receiptItemsKey(receiptId ?? ""),
    queryFn: () => purchaseReceiptsApi.listItems(receiptId as string),
    enabled: !!receiptId,
  });
}

export function useCreatePurchaseReceipt(purchaseOrderId: string) {
  return useInvalidatingMutation(
    (input: CreateReceiptInput) => purchaseReceiptsApi.create(input),
    [receiptsKey(purchaseOrderId)],
  );
}

export function useUpsertReceiptItem(receiptId: string) {
  return useInvalidatingMutation(
    (input: ReceiptItemInput) => purchaseReceiptsApi.upsertItem(receiptId, input),
    [receiptItemsKey(receiptId)],
  );
}

export function useFinalizeReceipt(receiptId: string, purchaseOrderId: string) {
  return useInvalidatingMutation(
    () => purchaseReceiptsApi.finalize(receiptId),
    [receiptsKey(purchaseOrderId), receiptKey(receiptId)],
  );
}

// ── Supplier Payments ─────────────────────────────────────────────────────

const paymentsKey = (poId: string) => ["supplier-payments", poId];

export function useSupplierPayments(purchaseOrderId: string | null) {
  return useQuery({
    queryKey: paymentsKey(purchaseOrderId ?? ""),
    queryFn: () => supplierPaymentsApi.listByPo(purchaseOrderId as string),
    enabled: !!purchaseOrderId,
  });
}

export function useTotalPaid(purchaseOrderId: string | null) {
  return useQuery({
    queryKey: [...paymentsKey(purchaseOrderId ?? ""), "total"],
    queryFn: () => supplierPaymentsApi.totalPaid(purchaseOrderId as string),
    enabled: !!purchaseOrderId,
  });
}

export function useRecordSupplierPayment(purchaseOrderId: string) {
  return useInvalidatingMutation(
    (input: SupplierPaymentInput) => supplierPaymentsApi.record(input),
    [paymentsKey(purchaseOrderId)],
  );
}
