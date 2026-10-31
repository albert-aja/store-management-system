package com.sms.foundation.employee;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployeeStoreRepository extends JpaRepository<EmployeeStore, UUID> {

    List<EmployeeStore> findByEmployeeId(UUID employeeId);

    @org.springframework.data.jpa.repository.Query(
            "select es.store.id from EmployeeStore es where es.employee.authUserId = :authUserId")
    List<UUID> findStoreIdsByAuthUserId(UUID authUserId);
}
