import { apiClient } from "../../lib/apiClient";
import type { Permission, Role } from "./types";

export const rolesApi = {
  list: () => apiClient.get<Role[]>("/api/roles").then((r) => r.data),
  listPermissions: () =>
    apiClient.get<Permission[]>("/api/roles/permissions").then((r) => r.data),
  listRolePermissions: (roleId: string) =>
    apiClient
      .get<Permission[]>(`/api/roles/${roleId}/permissions`)
      .then((r) => r.data),
  create: (input: { code: string; name: string; description?: string }) =>
    apiClient.post<Role>("/api/roles", input).then((r) => r.data),
  assignPermission: (roleId: string, permissionId: string) =>
    apiClient.post(`/api/roles/${roleId}/permissions/${permissionId}`),
  revokePermission: (roleId: string, permissionId: string) =>
    apiClient.delete(`/api/roles/${roleId}/permissions/${permissionId}`),
};
