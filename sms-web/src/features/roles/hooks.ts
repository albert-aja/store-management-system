import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rolesApi } from "./api";

const ROLES_KEY = ["roles"];
const PERMISSIONS_KEY = ["permissions"];
const rolePermissionsKey = (roleId: string) => ["role-permissions", roleId];

export function useRoles() {
  return useQuery({ queryKey: ROLES_KEY, queryFn: rolesApi.list });
}

export function usePermissions() {
  return useQuery({
    queryKey: PERMISSIONS_KEY,
    queryFn: rolesApi.listPermissions,
  });
}

export function useRolePermissions(roleId: string | null) {
  return useQuery({
    queryKey: rolePermissionsKey(roleId ?? ""),
    queryFn: () => rolesApi.listRolePermissions(roleId as string),
    enabled: !!roleId,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rolesApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ROLES_KEY }),
  });
}

export function useTogglePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roleId,
      permissionId,
      assign,
    }: {
      roleId: string;
      permissionId: string;
      assign: boolean;
    }) =>
      assign
        ? rolesApi.assignPermission(roleId, permissionId)
        : rolesApi.revokePermission(roleId, permissionId),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({
        queryKey: rolePermissionsKey(variables.roleId),
      }),
  });
}
