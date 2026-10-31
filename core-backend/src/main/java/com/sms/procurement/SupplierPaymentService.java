package com.sms.procurement;

import com.sms.common.web.BusinessRuleException;
import com.sms.common.web.NotFoundException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Records cash supplier payments against a PO (README 10.3).
 * Receiving and payment status are independent — a payment may be recorded on any non-CANCELLED PO.
 * Giro/check clearing is explicitly out of scope per the later design direction; if giro is introduced,
 * a clearing status field must be added and Paid must not be recognised until clearing succeeds.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class SupplierPaymentService {

    private final SupplierPaymentRepository paymentRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;

    @Transactional(readOnly = true)
    public List<SupplierPayment> listByPurchaseOrder(UUID purchaseOrderId) {
        return paymentRepository.findByPurchaseOrderId(purchaseOrderId);
    }

    @Transactional(readOnly = true)
    public BigDecimal totalPaid(UUID purchaseOrderId) {
        return paymentRepository.sumByPurchaseOrderId(purchaseOrderId);
    }

    /**
     * Record a new cash payment. Allowed on any PO except CANCELLED (README 10.3: receiving and
     * payment status are independent, so even a DRAFT PO could, in principle, receive a payment,
     * though in practice this would only happen on ISSUED POs).
     */
    public SupplierPayment recordPayment(UUID purchaseOrderId, BigDecimal amount, Instant paidAt, UUID payerId, String notes) {
        PurchaseOrder po = purchaseOrderRepository.findById(purchaseOrderId)
                .orElseThrow(() -> new NotFoundException("Purchase Order not found: " + purchaseOrderId));
        if (po.getStatus() == PurchaseOrderStatus.CANCELLED) {
            throw new BusinessRuleException("Cannot record a payment against a CANCELLED Purchase Order");
        }

        SupplierPayment payment = new SupplierPayment();
        payment.setPurchaseOrder(po);
        payment.setAmount(amount);
        payment.setPaidAt(paidAt != null ? paidAt : Instant.now());
        payment.setPayerId(payerId);
        payment.setNotes(notes);
        return paymentRepository.save(payment);
    }
}
