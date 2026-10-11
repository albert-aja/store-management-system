import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { approvalsApi } from "./api";

const WORKFLOWS_KEY = ["approval-workflows"];
const stepsKey = (workflowId: string) => [
  "approval-workflow-steps",
  workflowId,
];

export function useWorkflows() {
  return useQuery({
    queryKey: WORKFLOWS_KEY,
    queryFn: approvalsApi.listWorkflows,
  });
}

export function useWorkflowSteps(workflowId: string | null) {
  return useQuery({
    queryKey: stepsKey(workflowId ?? ""),
    queryFn: () => approvalsApi.listSteps(workflowId as string),
    enabled: !!workflowId,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approvalsApi.createWorkflow,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WORKFLOWS_KEY }),
  });
}

export function useAddStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workflowId,
      input,
    }: {
      workflowId: string;
      input: {
        stepOrder: number;
        name: string;
        approverRoleCode: string;
        description?: string;
      };
    }) => approvalsApi.addStep(workflowId, input),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({
        queryKey: stepsKey(variables.workflowId),
      }),
  });
}
