package com.sms.foundation.employee;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record EmployeeResponse(
        UUID id,
        String employeeNumber,
        String fullName,
        String nik,
        String phone,
        String email,
        LocalDate birthDate,
        EmploymentType employmentType,
        EmploymentStatus employmentStatus,
        UUID authUserId,
        List<String> roleCodes,
        List<UUID> storeIds,
        UUID supervisorEmployeeId) {

    public static EmployeeResponse from(Employee e, List<String> roleCodes, List<UUID> storeIds, UUID supervisorId) {
        return new EmployeeResponse(e.getId(), e.getEmployeeNumber(), e.getFullName(), e.getNik(), e.getPhone(),
                e.getEmail(), e.getBirthDate(), e.getEmploymentType(), e.getEmploymentStatus(), e.getAuthUserId(),
                roleCodes, storeIds, supervisorId);
    }
}
