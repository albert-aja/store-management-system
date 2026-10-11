package com.sms.foundation.employee;

import com.sms.common.security.SmsUserPrincipal;
import com.sms.foundation.role.RolePermissionRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class MeController {

    private final EmployeeRepository employeeRepository;
    private final RolePermissionRepository rolePermissionRepository;

    @GetMapping("/api/me")
    public MeResponse me(@AuthenticationPrincipal SmsUserPrincipal principal) {
        Employee employee = employeeRepository.findById(principal.employeeId()).orElseThrow();
        List<String> roleCodes = List.copyOf(principal.roles());
        List<String> permissionCodes = roleCodes.isEmpty()
                ? List.of()
                : rolePermissionRepository.findPermissionCodesByRoleCodes(roleCodes);
        return new MeResponse(employee.getId(), employee.getFullName(), roleCodes, permissionCodes,
                List.copyOf(principal.storeIds()));
    }
}
