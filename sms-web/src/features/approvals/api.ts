import { apiClient } from "../../lib/apiClient";
import type { ApprovalWorkflow, ApprovalWorkflowStep } from "./types";

export const approvalsApi = {
  listWorkflows: () =>
    apiClient
      .get<ApprovalWorkflow[]>("/api/approvals/workflows")
      .then((r) => r.data),
  createWorkflow: (input: {
    code: string;
    name: string;
    description?: string;
  }) =>
    apiClient
      .post<ApprovalWorkflow>("/api/approvals/workflows", input)
      .then((r) => r.data),
  listSteps: (workflowId: string) =>
    apiClient
      .get<
        ApprovalWorkflowStep[]
      >(`/api/approvals/workflows/${workflowId}/steps`)
      .then((r) => r.data),
  addStep: (
    workflowId: string,
    input: {
      stepOrder: number;
      name: string;
      approverRoleCode: string;
      description?: string;
    },
  ) =>
    apiClient
      .post<ApprovalWorkflowStep>(
        `/api/approvals/workflows/${workflowId}/steps`,
        input,
      )
      .then((r) => r.data),
};
