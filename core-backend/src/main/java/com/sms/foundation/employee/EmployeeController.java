package com.sms.foundation.employee;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('EMPLOYEE_MANAGE')")
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping
    public List<EmployeeResponse> listEmployees() {
        return employeeService.listEmployees().stream().map(employeeService::toResponse).toList();
    }

    @GetMapping("/{id}")
    public EmployeeResponse getEmployee(@PathVariable UUID id) {
        return employeeService.toResponse(employeeService.getEmployee(id));
    }

    @PostMapping
    public EmployeeResponse createEmployee(@Valid @RequestBody EmployeeRequest request) {
        return employeeService.toResponse(employeeService.createEmployee(request));
    }

    @PutMapping("/{id}")
    public EmployeeResponse updateEmployee(@PathVariable UUID id, @Valid @RequestBody EmployeeRequest request) {
        return employeeService.toResponse(employeeService.updateEmployee(id, request));
    }

    @PostMapping("/{id}/deactivate")
    public void deactivate(@PathVariable UUID id) {
        employeeService.setActive(id, false);
    }

    @PostMapping("/{id}/activate")
    public void activate(@PathVariable UUID id) {
        employeeService.setActive(id, true);
    }

    @PostMapping("/{id}/roles/{roleId}")
    public void assignRole(@PathVariable UUID id, @PathVariable UUID roleId) {
        employeeService.assignRole(id, roleId);
    }

    @PostMapping("/{id}/stores/{storeId}")
    public void assignStore(@PathVariable UUID id, @PathVariable UUID storeId) {
        employeeService.assignStore(id, storeId);
    }

    @PostMapping("/{id}/supervisor/{supervisorId}")
    public void setSupervisor(@PathVariable UUID id, @PathVariable UUID supervisorId) {
        employeeService.setSupervisor(id, supervisorId);
    }
}
