package com.sms.foundation.employee;

import com.sms.common.security.SmsUserPrincipal;
import com.sms.common.web.NotFoundException;
import com.sms.foundation.role.RolePermissionRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class MeController {

    private final EmployeeRepository employeeRepository;
    private final EmployeeRoleRepository employeeRoleRepository;
    private final EmployeeStoreRepository employeeStoreRepository;
    private final RolePermissionRepository rolePermissionRepository;

    public record MeResponse(
            UUID employeeId,
            String fullName,
            List<String> roleCodes,
            List<String> permissionCodes,
            List<UUID> storeIds
    ) {}

    @GetMapping
    public MeResponse getMe() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof SmsUserPrincipal p) {
            Employee employee = employeeRepository.findById(p.employeeId())
                    .orElseThrow(() -> new NotFoundException("Employee not found"));

            List<String> roleCodes = employeeRoleRepository.findRoleCodesByAuthUserId(p.authUserId());
            List<UUID> storeIds = employeeStoreRepository.findStoreIdsByAuthUserId(p.authUserId());
            List<String> permissionCodes = roleCodes.isEmpty()
                    ? List.of()
                    : rolePermissionRepository.findPermissionCodesByRoleCodes(roleCodes);

            return new MeResponse(
                    employee.getId(),
                    employee.getFullName(),
                    roleCodes,
                    permissionCodes,
                    storeIds
            );
        }
        throw new BadCredentialsException("Not authenticated");
    }
}
