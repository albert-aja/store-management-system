package com.sms.foundation.employee;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record EmployeeRequest(
        @NotBlank String employeeNumber,
        @NotBlank String fullName,
        String nik,
        String phone,
        String email,
        LocalDate birthDate,
        String address,
        String emergencyContactName,
        String emergencyContactPhone,
        @NotNull EmploymentType employmentType,
        LocalDate hireDate,
        String notes) {
}
