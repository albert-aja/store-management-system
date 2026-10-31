package com.sms.foundation.role;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @GetMapping
    public List<RoleResponse> listRoles() {
        return roleService.listRoles().stream().map(RoleResponse::from).toList();
    }

    @GetMapping("/permissions")
    public List<PermissionResponse> listPermissions() {
        return roleService.listPermissions().stream().map(PermissionResponse::from).toList();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_MANAGE')")
    public RoleResponse createRole(@RequestBody RoleRequest request) {
        return RoleResponse.from(roleService.createRole(request.code(), request.name(), request.description()));
    }

    @GetMapping("/{roleId}/permissions")
    public List<PermissionResponse> listRolePermissions(@PathVariable UUID roleId) {
        return roleService.listRolePermissions(roleId).stream()
                .map(rp -> PermissionResponse.from(rp.getPermission())).toList();
    }

    @PostMapping("/{roleId}/permissions/{permissionId}")
    @PreAuthorize("hasAuthority('ROLE_MANAGE')")
    public void assignPermission(@PathVariable UUID roleId, @PathVariable UUID permissionId) {
        roleService.assignPermission(roleId, permissionId);
    }

    @DeleteMapping("/{roleId}/permissions/{permissionId}")
    @PreAuthorize("hasAuthority('ROLE_MANAGE')")
    public void revokePermission(@PathVariable UUID roleId, @PathVariable UUID permissionId) {
        roleService.revokePermission(roleId, permissionId);
    }
}
