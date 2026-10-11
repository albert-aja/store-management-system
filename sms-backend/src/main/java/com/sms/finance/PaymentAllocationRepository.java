package com.sms.finance;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentAllocationRepository extends JpaRepository<PaymentAllocation, UUID> {

    List<PaymentAllocation> findByCustomerPaymentId(UUID customerPaymentId);

    List<PaymentAllocation> findByReceivableInstallmentId(UUID receivableInstallmentId);
}
