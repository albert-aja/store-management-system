package com.sms.procurement;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PurchaseReceiptRepository extends JpaRepository<PurchaseReceipt, UUID> {

    List<PurchaseReceipt> findByPurchaseOrderId(UUID purchaseOrderId);

    @Query("select count(r) > 0 from PurchaseReceipt r where r.purchaseOrder.id = :poId")
    boolean existsByPurchaseOrderId(@Param("poId") UUID poId);
}
