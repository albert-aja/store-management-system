import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeesApi } from "./api";
import type { EmployeeInput } from "./types";

const EMPLOYEES_KEY = ["employees"];

export function useEmployees() {
  return useQuery({ queryKey: EMPLOYEES_KEY, queryFn: employeesApi.list });
}

function useInvalidatingMutation<TVariables>(
  mutationFn: (vars: TVariables) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY }),
  });
}

export function useCreateEmployee() {
  return useInvalidatingMutation((input: EmployeeInput) =>
    employeesApi.create(input),
  );
}

export function useUpdateEmployee() {
  return useInvalidatingMutation(
    ({ id, input }: { id: string; input: EmployeeInput }) =>
      employeesApi.update(id, input),
  );
}

export function useSetEmployeeActive() {
  return useInvalidatingMutation(
    ({ id, active }: { id: string; active: boolean }) =>
      active ? employeesApi.activate(id) : employeesApi.deactivate(id),
  );
}

export function useAssignRole() {
  return useInvalidatingMutation(
    ({ id, roleId }: { id: string; roleId: string }) =>
      employeesApi.assignRole(id, roleId),
  );
}

export function useAssignStore() {
  return useInvalidatingMutation(
    ({ id, storeId }: { id: string; storeId: string }) =>
      employeesApi.assignStore(id, storeId),
  );
}

export function useSetSupervisor() {
  return useInvalidatingMutation(
    ({ id, supervisorId }: { id: string; supervisorId: string }) =>
      employeesApi.setSupervisor(id, supervisorId),
  );
}
