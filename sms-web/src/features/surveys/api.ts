import { apiClient } from "../../lib/apiClient";
import type { AssessmentInput, Survey } from "./types";

export const surveysApi = {
  get: (salesOrderId: string) =>
    apiClient
      .get<Survey>(`/api/sales-orders/${salesOrderId}/survey`)
      .then((r) => r.data),
  create: (salesOrderId: string) =>
    apiClient
      .post<Survey>(`/api/sales-orders/${salesOrderId}/survey`)
      .then((r) => r.data),
  assignSurveyor: (salesOrderId: string, surveyorEmployeeId: string) =>
    apiClient
      .post<Survey>(
        `/api/sales-orders/${salesOrderId}/survey/assign/${surveyorEmployeeId}`,
      )
      .then((r) => r.data),
  updateAssessment: (salesOrderId: string, input: AssessmentInput) =>
    apiClient
      .put<Survey>(`/api/sales-orders/${salesOrderId}/survey/assessment`, input)
      .then((r) => r.data),
  decide: (salesOrderId: string, approve: boolean, notes?: string) =>
    apiClient
      .post<Survey>(`/api/sales-orders/${salesOrderId}/survey/decide`, {
        approve,
        notes,
      })
      .then((r) => r.data),
};
