import { apiClient } from "../../lib/apiClient";
import type {
  CollectionAttempt,
  CreateReceivableInput,
  CustomerCreditSummary,
  CustomerPayment,
  HandoverCashInput,
  PaymentCustody,
  Receivable,
  ReceivableStatus,
  RecordCollectionAttemptInput,
  RecordPaymentInput,
  VerifyCashInput,
} from "./types";

export async function listReceivables(params?: {
  storeId?: string;
  customerId?: string;
  status?: ReceivableStatus;
}): Promise<Receivable[]> {
  const { data } = await apiClient.get<Receivable[]>("/api/finance/receivables", {
    params,
  });
  return data;
}

export async function getReceivable(id: string): Promise<Receivable> {
  const { data } = await apiClient.get<Receivable>(
    `/api/finance/receivables/${id}`,
  );
  return data;
}

export async function listReceivablesBySalesOrder(
  salesOrderId: string,
): Promise<Receivable[]> {
  const { data } = await apiClient.get<Receivable[]>(
    `/api/finance/receivables/by-sales-order/${salesOrderId}`,
  );
  return data;
}

export async function getCustomerCreditSummary(
  customerId: string,
): Promise<CustomerCreditSummary> {
  const { data } = await apiClient.get<CustomerCreditSummary>(
    `/api/finance/receivables/customers/${customerId}/summary`,
  );
  return data;
}

export async function createReceivable(
  input: CreateReceivableInput,
): Promise<Receivable> {
  const { data } = await apiClient.post<Receivable>(
    "/api/finance/receivables",
    input,
  );
  return data;
}

export async function listCustomerPayments(params?: {
  storeId?: string;
  customerId?: string;
}): Promise<CustomerPayment[]> {
  const { data } = await apiClient.get<CustomerPayment[]>(
    "/api/finance/payments",
    { params },
  );
  return data;
}

export async function recordCustomerPayment(
  input: RecordPaymentInput,
): Promise<CustomerPayment> {
  const { data } = await apiClient.post<CustomerPayment>(
    "/api/finance/payments",
    input,
  );
  return data;
}

export async function listPaymentCustodies(params?: {
  holderId?: string;
  status?: string;
}): Promise<PaymentCustody[]> {
  const { data } = await apiClient.get<PaymentCustody[]>(
    "/api/finance/custodies",
    { params },
  );
  return data;
}

export async function handoverCash(
  id: string,
  input: HandoverCashInput,
): Promise<PaymentCustody> {
  const { data } = await apiClient.post<PaymentCustody>(
    `/api/finance/custodies/${id}/handover`,
    input,
  );
  return data;
}

export async function verifyCash(
  id: string,
  input: VerifyCashInput,
): Promise<PaymentCustody> {
  const { data } = await apiClient.post<PaymentCustody>(
    `/api/finance/custodies/${id}/verify`,
    input,
  );
  return data;
}

export async function listCollectionAttempts(params?: {
  storeId?: string;
  customerId?: string;
}): Promise<CollectionAttempt[]> {
  const { data } = await apiClient.get<CollectionAttempt[]>(
    "/api/finance/collections",
    { params },
  );
  return data;
}

export async function recordCollectionAttempt(
  input: RecordCollectionAttemptInput,
): Promise<CollectionAttempt> {
  const { data } = await apiClient.post<CollectionAttempt>(
    "/api/finance/collections",
    input,
  );
  return data;
}
