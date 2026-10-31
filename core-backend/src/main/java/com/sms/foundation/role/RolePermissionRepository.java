package com.sms.foundation.role;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RolePermissionRepository extends JpaRepository<RolePermission, UUID> {

    List<RolePermission> findByRoleId(UUID roleId);

    @org.springframework.data.jpa.repository.Query(
            "select rp.permission.code from RolePermission rp where rp.role.code in :roleCodes")
    List<String> findPermissionCodesByRoleCodes(List<String> roleCodes);
}
