package com.sms.procurement;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;

public interface SupplierPaymentRepository extends JpaRepository<SupplierPayment, UUID> {

    List<SupplierPayment> findByPurchaseOrderId(UUID purchaseOrderId);

    @Query("select coalesce(sum(p.amount), 0) from SupplierPayment p where p.purchaseOrder.id = :poId")
    BigDecimal sumByPurchaseOrderId(@Param("poId") UUID poId);
}
