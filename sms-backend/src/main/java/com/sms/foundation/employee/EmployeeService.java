package com.sms.foundation.employee;

import com.sms.common.web.ConflictException;
import com.sms.common.web.NotFoundException;
import com.sms.foundation.role.Role;
import com.sms.foundation.role.RoleRepository;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final EmployeeRoleRepository employeeRoleRepository;
    private final EmployeeStoreRepository employeeStoreRepository;
    private final EmployeeReportingRepository employeeReportingRepository;
    private final RoleRepository roleRepository;
    private final StoreRepository storeRepository;

    @Transactional(readOnly = true)
    public List<Employee> listEmployees() {
        return employeeRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Employee getEmployee(UUID id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Employee not found: " + id));
    }

    public Employee createEmployee(EmployeeRequest request) {
        if (employeeRepository.existsByEmployeeNumber(request.employeeNumber())) {
            throw new ConflictException("Employee number already exists: " + request.employeeNumber());
        }
        if (request.nik() != null && employeeRepository.existsByNik(request.nik())) {
            throw new ConflictException("NIK already exists: " + request.nik());
        }
        Employee employee = new Employee();
        applyRequest(employee, request);
        return employeeRepository.save(employee);
    }

    public Employee updateEmployee(UUID id, EmployeeRequest request) {
        Employee employee = getEmployee(id);
        applyRequest(employee, request);
        return employee;
    }

    private void applyRequest(Employee employee, EmployeeRequest request) {
        employee.setEmployeeNumber(request.employeeNumber());
        employee.setFullName(request.fullName());
        employee.setNik(request.nik());
        employee.setPhone(request.phone());
        employee.setEmail(request.email());
        employee.setBirthDate(request.birthDate());
        employee.setAddress(request.address());
        employee.setEmergencyContactName(request.emergencyContactName());
        employee.setEmergencyContactPhone(request.emergencyContactPhone());
        employee.setEmploymentType(request.employmentType());
        employee.setHireDate(request.hireDate());
        employee.setNotes(request.notes());
    }

    public void setActive(UUID id, boolean active) {
        getEmployee(id).setEmploymentStatus(active ? EmploymentStatus.ACTIVE : EmploymentStatus.INACTIVE);
    }

    public void assignRole(UUID employeeId, UUID roleId) {
        Employee employee = getEmployee(employeeId);
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new NotFoundException("Role not found: " + roleId));
        boolean alreadyAssigned = employeeRoleRepository.findByEmployeeId(employeeId).stream()
                .anyMatch(er -> er.getRole().getId().equals(roleId));
        if (alreadyAssigned) {
            return;
        }
        EmployeeRole employeeRole = new EmployeeRole();
        employeeRole.setEmployee(employee);
        employeeRole.setRole(role);
        employeeRoleRepository.save(employeeRole);
    }

    public void revokeRole(UUID employeeId, UUID roleId) {
        employeeRoleRepository.findByEmployeeId(employeeId).stream()
                .filter(er -> er.getRole().getId().equals(roleId))
                .forEach(employeeRoleRepository::delete);
    }

    public void assignStore(UUID employeeId, UUID storeId) {
        Employee employee = getEmployee(employeeId);
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new NotFoundException("Store not found: " + storeId));
        boolean alreadyAssigned = employeeStoreRepository.findByEmployeeId(employeeId).stream()
                .anyMatch(es -> es.getStore().getId().equals(storeId));
        if (alreadyAssigned) {
            return;
        }
        EmployeeStore employeeStore = new EmployeeStore();
        employeeStore.setEmployee(employee);
        employeeStore.setStore(store);
        employeeStoreRepository.save(employeeStore);
    }

    public void revokeStore(UUID employeeId, UUID storeId) {
        employeeStoreRepository.findByEmployeeId(employeeId).stream()
                .filter(es -> es.getStore().getId().equals(storeId))
                .forEach(employeeStoreRepository::delete);
    }

    public void setSupervisor(UUID employeeId, UUID supervisorEmployeeId) {
        Employee employee = getEmployee(employeeId);
        Employee supervisor = getEmployee(supervisorEmployeeId);
        EmployeeReporting reporting = employeeReportingRepository.findByEmployeeId(employeeId)
                .orElseGet(EmployeeReporting::new);
        reporting.setEmployee(employee);
        reporting.setSupervisor(supervisor);
        employeeReportingRepository.save(reporting);
    }

    @Transactional(readOnly = true)
    public EmployeeResponse toResponse(Employee employee) {
        List<String> roleCodes = employeeRoleRepository.findByEmployeeId(employee.getId()).stream()
                .map(er -> er.getRole().getCode()).toList();
        List<UUID> storeIds = employeeStoreRepository.findByEmployeeId(employee.getId()).stream()
                .map(es -> es.getStore().getId()).toList();
        UUID supervisorId = employeeReportingRepository.findByEmployeeId(employee.getId())
                .map(er -> er.getSupervisor().getId()).orElse(null);
        return EmployeeResponse.from(employee, roleCodes, storeIds, supervisorId);
    }
}
