package com.sms.common.security;

import com.sms.foundation.employee.Employee;
import com.sms.foundation.employee.EmployeeRepository;
import com.sms.foundation.employee.EmployeeRoleRepository;
import com.sms.foundation.employee.EmployeeStoreRepository;
import com.sms.foundation.role.RolePermissionRepository;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/**
 * Resolves the Supabase JWT `sub` claim to the linked employee, then grants authorities
 * from the employee's current role permissions (not the JWT itself — backend stays authoritative).
 */
@Component
@RequiredArgsConstructor
public class SupabaseJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final EmployeeRepository employeeRepository;
    private final EmployeeRoleRepository employeeRoleRepository;
    private final EmployeeStoreRepository employeeStoreRepository;
    private final RolePermissionRepository rolePermissionRepository;

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        UUID authUserId = UUID.fromString(jwt.getSubject());
        Employee employee = employeeRepository.findByAuthUserId(authUserId)
                .orElseThrow(() -> new BadCredentialsException("No employee linked to this account"));

        List<String> roleCodes = employeeRoleRepository.findRoleCodesByAuthUserId(authUserId);
        List<UUID> storeIds = employeeStoreRepository.findStoreIdsByAuthUserId(authUserId);
        List<String> permissionCodes = roleCodes.isEmpty()
                ? List.of()
                : rolePermissionRepository.findPermissionCodesByRoleCodes(roleCodes);

        SmsUserPrincipal principal = new SmsUserPrincipal(
                employee.getId(), authUserId, Set.copyOf(roleCodes), Set.copyOf(storeIds));

        List<GrantedAuthority> authorities = permissionCodes.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
        roleCodes.forEach(code -> authorities.add(new SimpleGrantedAuthority("ROLE_" + code)));

        return new SmsAuthenticationToken(principal, jwt, authorities);
    }
}
