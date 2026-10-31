package com.sms.foundation.role;

import com.sms.common.web.NotFoundException;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;

    @Transactional(readOnly = true)
    public List<Role> listRoles() {
        return roleRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Permission> listPermissions() {
        return permissionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<RolePermission> listRolePermissions(UUID roleId) {
        return rolePermissionRepository.findByRoleId(roleId);
    }

    public Role createRole(String code, String name, String description) {
        Role role = new Role();
        role.setCode(code);
        role.setName(name);
        role.setDescription(description);
        return roleRepository.save(role);
    }

    public void assignPermission(UUID roleId, UUID permissionId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new NotFoundException("Role not found: " + roleId));
        Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new NotFoundException("Permission not found: " + permissionId));
        boolean alreadyAssigned = rolePermissionRepository.findByRoleId(roleId).stream()
                .anyMatch(rp -> rp.getPermission().getId().equals(permissionId));
        if (alreadyAssigned) {
            return;
        }
        RolePermission rolePermission = new RolePermission();
        rolePermission.setRole(role);
        rolePermission.setPermission(permission);
        rolePermissionRepository.save(rolePermission);
    }

    public void revokePermission(UUID roleId, UUID permissionId) {
        rolePermissionRepository.findByRoleId(roleId).stream()
                .filter(rp -> rp.getPermission().getId().equals(permissionId))
                .forEach(rolePermissionRepository::delete);
    }
}
