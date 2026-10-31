package com.sms.procurement;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierContactRepository extends JpaRepository<SupplierContact, UUID> {

    List<SupplierContact> findBySupplierIdOrderByCreatedAtDesc(UUID supplierId);
}
