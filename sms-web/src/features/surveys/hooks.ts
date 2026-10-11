import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { surveysApi } from "./api";
import type { AssessmentInput } from "./types";

const surveyKey = (salesOrderId: string) => ["survey", salesOrderId];

export function useSurvey(salesOrderId: string | null) {
  return useQuery({
    queryKey: surveyKey(salesOrderId ?? ""),
    queryFn: () => surveysApi.get(salesOrderId as string),
    enabled: !!salesOrderId,
    retry: false,
  });
}

function useInvalidatingMutation<TVariables, TData>(
  mutationFn: (vars: TVariables) => Promise<TData>,
  salesOrderId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: surveyKey(salesOrderId) }),
  });
}

export function useCreateSurvey(salesOrderId: string) {
  return useInvalidatingMutation(
    () => surveysApi.create(salesOrderId),
    salesOrderId,
  );
}

export function useAssignSurveyor(salesOrderId: string) {
  return useInvalidatingMutation(
    (surveyorEmployeeId: string) =>
      surveysApi.assignSurveyor(salesOrderId, surveyorEmployeeId),
    salesOrderId,
  );
}

export function useUpdateAssessment(salesOrderId: string) {
  return useInvalidatingMutation(
    (input: AssessmentInput) =>
      surveysApi.updateAssessment(salesOrderId, input),
    salesOrderId,
  );
}

export function useDecideSurvey(salesOrderId: string) {
  return useInvalidatingMutation(
    ({ approve, notes }: { approve: boolean; notes?: string }) =>
      surveysApi.decide(salesOrderId, approve, notes),
    salesOrderId,
  );
}
