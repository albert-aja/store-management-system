package com.sms.sales;

import com.sms.common.web.BusinessRuleException;
import com.sms.common.web.NotFoundException;
import com.sms.customer.Customer;
import com.sms.customer.CustomerAddress;
import com.sms.customer.CustomerAddressRepository;
import com.sms.customer.CustomerRepository;
import com.sms.foundation.approval.ApprovalRequest;
import com.sms.foundation.approval.ApprovalRequestRepository;
import com.sms.foundation.approval.ApprovalService;
import com.sms.foundation.approval.ApprovalStatus;
import com.sms.foundation.employee.Employee;
import com.sms.foundation.employee.EmployeeRepository;
import com.sms.foundation.numbering.DocumentNumberingService;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import com.sms.pricing.StoreProductPaymentPlanRepository;
import com.sms.pricing.StoreProductPrice;
import com.sms.pricing.StoreProductPriceRepository;
import com.sms.product.dto.ProductVariant;
import com.sms.product.repository.ProductVariantRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class SalesOrderService {

    private static final String DOC_TYPE = "SO";

    private final SalesOrderRepository salesOrderRepository;
    private final SalesOrderItemRepository itemRepository;
    private final StoreRepository storeRepository;
    private final CustomerRepository customerRepository;
    private final CustomerAddressRepository addressRepository;
    private final EmployeeRepository employeeRepository;
    private final ProductVariantRepository variantRepository;
    private final StoreProductPriceRepository priceRepository;
    private final StoreProductPaymentPlanRepository planRepository;
    private final ApprovalService approvalService;
    private final ApprovalRequestRepository approvalRequestRepository;
    private final DocumentNumberingService numberingService;
    private final com.sms.survey.SurveyRepository surveyRepository;
    private final com.sms.inventory.ReservationService reservationService;
    private final com.sms.finance.FinanceService financeService;

    @Transactional(readOnly = true)
    public List<SalesOrder> search(UUID storeId, UUID customerId, SalesOrderStatus status) {
        return salesOrderRepository.search(storeId, customerId, status);
    }

    @Transactional(readOnly = true)
    public SalesOrder getSalesOrder(UUID id) {
        return salesOrderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Sales Order not found: " + id));
    }

    public SalesOrder createDraft(UUID storeId, UUID customerId, UUID salespersonEmployeeId, UUID deliveryAddressId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new NotFoundException("Store not found: " + storeId));
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException("Customer not found: " + customerId));
        Employee salesperson = employeeRepository.findById(salespersonEmployeeId)
                .orElseThrow(() -> new NotFoundException("Employee not found: " + salespersonEmployeeId));

        SalesOrder salesOrder = new SalesOrder();
        salesOrder.setStore(store);
        salesOrder.setCustomer(customer);
        salesOrder.setSalesperson(salesperson);
        applyDeliveryAddress(salesOrder, deliveryAddressId);
        return salesOrderRepository.save(salesOrder);
    }

    public SalesOrder updateDraftHeader(UUID id, UUID customerId, UUID deliveryAddressId) {
        SalesOrder salesOrder = requireStatus(id, SalesOrderStatus.DRAFT);
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException("Customer not found: " + customerId));
        salesOrder.setCustomer(customer);
        applyDeliveryAddress(salesOrder, deliveryAddressId);
        return salesOrder;
    }

    private void applyDeliveryAddress(SalesOrder salesOrder, UUID deliveryAddressId) {
        if (deliveryAddressId == null) {
            salesOrder.setDeliveryAddress(null);
            salesOrder.setDeliveryAddressSnapshot(null);
            return;
        }
        CustomerAddress address = addressRepository.findById(deliveryAddressId)
                .orElseThrow(() -> new NotFoundException("Address not found: " + deliveryAddressId));
        salesOrder.setDeliveryAddress(address);
        salesOrder.setDeliveryAddressSnapshot(address.getAddressLine());
    }

    @Transactional(readOnly = true)
    public List<SalesOrderItem> listItems(UUID salesOrderId) {
        return itemRepository.findBySalesOrderId(salesOrderId);
    }

    public SalesOrderItem addItem(UUID salesOrderId, UUID variantId, int quantity, int paymentTermMonths, BigDecimal finalPrice) {
        SalesOrder salesOrder = requireStatus(salesOrderId, SalesOrderStatus.DRAFT);
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new NotFoundException("Variant not found: " + variantId));
        BigDecimal referencePrice = resolveReferencePrice(salesOrder.getStore().getId(), variantId, paymentTermMonths);

        SalesOrderItem item = new SalesOrderItem();
        item.setSalesOrder(salesOrder);
        item.setProductVariant(variant);
        item.setQuantity(quantity);
        item.setPaymentTermMonths(paymentTermMonths);
        item.setReferencePrice(referencePrice);
        item.setFinalPrice(finalPrice);
        SalesOrderItem saved = itemRepository.save(item);
        recomputeRequiresPriceApproval(salesOrder);
        return saved;
    }

    private BigDecimal resolveReferencePrice(UUID storeId, UUID variantId, int paymentTermMonths) {
        StoreProductPrice price = priceRepository.findByStoreIdAndProductVariantId(storeId, variantId)
                .orElseThrow(() -> new NotFoundException("No price configured for this store/variant"));
        if (paymentTermMonths == 0) {
            return price.getCashPrice();
        }
        return planRepository.findByStoreProductPriceIdAndTermMonths(price.getId(), paymentTermMonths)
                .orElseThrow(() -> new NotFoundException("No payment plan configured for term " + paymentTermMonths))
                .getTotalPrice();
    }

    /** Draft items are workspace data, not yet historical truth (README 8.1) \u2014 hard delete is acceptable only here. */
    public void removeItem(UUID itemId) {
        SalesOrderItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("Item not found: " + itemId));
        requireStatus(item.getSalesOrder().getId(), SalesOrderStatus.DRAFT);
        itemRepository.delete(item);
        recomputeRequiresPriceApproval(item.getSalesOrder());
    }

    private void recomputeRequiresPriceApproval(SalesOrder salesOrder) {
        boolean negotiated = itemRepository.findBySalesOrderId(salesOrder.getId()).stream()
                .anyMatch(i -> i.getFinalPrice().compareTo(i.getReferencePrice()) != 0);
        salesOrder.setRequiresPriceApproval(negotiated);
    }

    public SalesOrder submitForPriceApproval(UUID id, String workflowCode, UUID requestedBy) {
        SalesOrder salesOrder = requireStatus(id, SalesOrderStatus.DRAFT);
        if (!salesOrder.isRequiresPriceApproval()) {
            throw new BusinessRuleException("Sales Order has no negotiated price; release directly instead");
        }
        if (itemRepository.findBySalesOrderId(id).isEmpty()) {
            throw new BusinessRuleException("Sales Order has no items");
        }
        ApprovalRequest request = approvalService.createRequest(workflowCode, "SALES_ORDER", id, requestedBy);
        salesOrder.setApprovalRequestId(request.getId());
        salesOrder.setStatus(SalesOrderStatus.PENDING_PRICE_APPROVAL);
        // README 7.1: reservation begins at Waiting for Owner Price Approval for negotiated-price SOs.
        reservationService.reserveForSalesOrder(salesOrder);
        return salesOrder;
    }

    /** Rejected negotiation returns to Draft for revision; it never becomes an official SO (README 8.1/20#1). */
    public SalesOrder reviseAfterRejection(UUID id) {
        SalesOrder salesOrder = requireStatus(id, SalesOrderStatus.REJECTED);
        salesOrder.setApprovalRequestId(null);
        salesOrder.setStatus(SalesOrderStatus.DRAFT);
        reservationService.releaseForSalesOrder(id);
        return salesOrder;
    }

    public SalesOrder release(UUID id) {
        SalesOrder salesOrder = getSalesOrder(id);
        if (salesOrder.getStatus() != SalesOrderStatus.DRAFT && salesOrder.getStatus() != SalesOrderStatus.PENDING_PRICE_APPROVAL) {
            throw new BusinessRuleException("Cannot release from status " + salesOrder.getStatus());
        }
        List<SalesOrderItem> items = itemRepository.findBySalesOrderId(id);
        if (items.isEmpty()) {
            throw new BusinessRuleException("Sales Order has no items");
        }
        if (salesOrder.getDeliveryAddress() == null) {
            throw new BusinessRuleException("Delivery address is required to release");
        }
        if (salesOrder.isRequiresPriceApproval()) {
            if (salesOrder.getApprovalRequestId() == null) {
                throw new BusinessRuleException("Negotiated price requires price approval before release");
            }
            ApprovalRequest request = approvalRequestRepository.findById(salesOrder.getApprovalRequestId())
                    .orElseThrow(() -> new NotFoundException("Approval request not found"));
            if (request.getStatus() == ApprovalStatus.REJECTED) {
                salesOrder.setStatus(SalesOrderStatus.REJECTED);
                reservationService.releaseForSalesOrder(id);
                throw new BusinessRuleException("Price negotiation was rejected; revise the Sales Order");
            }
            if (request.getStatus() != ApprovalStatus.APPROVED) {
                throw new BusinessRuleException("Price approval is still pending");
            }
        }
        // Re-snapshot the address at the moment of release, the authoritative freeze point (README 5.3).
        salesOrder.setDeliveryAddressSnapshot(salesOrder.getDeliveryAddress().getAddressLine());
        salesOrder.setNumber(numberingService.nextNumber(salesOrder.getStore().getId(), DOC_TYPE));
        salesOrder.setStatus(SalesOrderStatus.RELEASED);
        salesOrder.setReleasedAt(Instant.now());
        if (!salesOrder.isRequiresPriceApproval()) {
            // Resolves README 21's open decision: for non-negotiated SOs, Release is the equivalent
            // reservation boundary (negotiated SOs already reserved at price-approval submission).
            reservationService.reserveForSalesOrder(salesOrder);
        }
        return salesOrder;
    }

    public SalesOrder cancel(UUID id, String reason) {
        SalesOrder salesOrder = getSalesOrder(id);
        if (salesOrder.getStatus() != SalesOrderStatus.DRAFT && salesOrder.getStatus() != SalesOrderStatus.RELEASED) {
            throw new BusinessRuleException("Cannot cancel from status " + salesOrder.getStatus());
        }
        salesOrder.setStatus(SalesOrderStatus.CANCELLED);
        salesOrder.setCancelledAt(Instant.now());
        salesOrder.setCancelReason(reason);
        reservationService.releaseForSalesOrder(id);
        return salesOrder;
    }

    /**
     * Customer confirmation + required DP (README 8.2). Exact DP threshold/enforcement rules are an
     * explicit Open Decision (README 21) — this only records the attestation for now; real DP payment
     * capture arrives with the Finance/Payment module.
     */
    public SalesOrder confirm(UUID id, boolean dpReceived, BigDecimal dpAmount, String paymentMethod, UUID collectorEmployeeId, String notes) {
        SalesOrder salesOrder = requireStatus(id, SalesOrderStatus.RELEASED);
        boolean isCredit = itemRepository.findBySalesOrderId(id).stream().anyMatch(i -> i.getPaymentTermMonths() > 0);
        if (isCredit) {
            com.sms.survey.Survey survey = surveyRepository.findBySalesOrderId(id)
                    .orElseThrow(() -> new BusinessRuleException("Credit Sales Order requires an approved survey before confirmation"));
            if (survey.getStatus() != com.sms.survey.SurveyStatus.APPROVED) {
                throw new BusinessRuleException("Survey must be Approved before confirmation");
            }
        }
        if (!dpReceived) {
            throw new BusinessRuleException("DP must be received before confirmation");
        }

        // D.2: If DP payment amount is specified, automatically record official customer_payment and cash custody in Finance
        if (dpAmount != null && dpAmount.compareTo(BigDecimal.ZERO) > 0 && financeService != null) {
            com.sms.finance.dto.RecordPaymentRequest payReq = new com.sms.finance.dto.RecordPaymentRequest();
            payReq.setStoreId(salesOrder.getStore().getId());
            payReq.setCustomerId(salesOrder.getCustomer().getId());
            payReq.setSalesOrderId(salesOrder.getId());
            payReq.setAmount(dpAmount);
            payReq.setPaymentType(com.sms.finance.PaymentType.DOWN_PAYMENT);
            payReq.setPaymentMethod(paymentMethod != null && (paymentMethod.equalsIgnoreCase("TRANSFER") || paymentMethod.equalsIgnoreCase("BANK_TRANSFER"))
                    ? com.sms.finance.PaymentMethod.BANK_TRANSFER
                    : com.sms.finance.PaymentMethod.CASH);
            payReq.setCollectedById(collectorEmployeeId);
            payReq.setNotes(notes != null ? notes : "DP for SO " + salesOrder.getNumber());
            financeService.recordPayment(payReq);
        }

        salesOrder.setStatus(SalesOrderStatus.CONFIRMED);
        return salesOrder;
    }

    public SalesOrder confirm(UUID id, boolean dpReceived) {
        return confirm(id, dpReceived, null, null, null, null);
    }

    private SalesOrder requireStatus(UUID id, SalesOrderStatus expected) {
        SalesOrder salesOrder = getSalesOrder(id);
        if (salesOrder.getStatus() != expected) {
            throw new BusinessRuleException("Expected status " + expected + " but was " + salesOrder.getStatus());
        }
        return salesOrder;
    }
}
