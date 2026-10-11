import { apiClient } from "../../lib/apiClient";
import type { Employee, EmployeeInput } from "./types";

export const employeesApi = {
  list: () => apiClient.get<Employee[]>("/api/employees").then((r) => r.data),
  create: (input: EmployeeInput) =>
    apiClient.post<Employee>("/api/employees", input).then((r) => r.data),
  update: (id: string, input: EmployeeInput) =>
    apiClient.put<Employee>(`/api/employees/${id}`, input).then((r) => r.data),
  deactivate: (id: string) => apiClient.post(`/api/employees/${id}/deactivate`),
  activate: (id: string) => apiClient.post(`/api/employees/${id}/activate`),
  assignRole: (id: string, roleId: string) =>
    apiClient.post(`/api/employees/${id}/roles/${roleId}`),
  assignStore: (id: string, storeId: string) =>
    apiClient.post(`/api/employees/${id}/stores/${storeId}`),
  setSupervisor: (id: string, supervisorId: string) =>
    apiClient.post(`/api/employees/${id}/supervisor/${supervisorId}`),
};
