package com.sms.storefront.service;

import com.sms.customer.Customer;
import com.sms.customer.CustomerAddress;
import com.sms.customer.CustomerAddressRepository;
import com.sms.customer.CustomerRepository;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import com.sms.inventory.StockAvailability;
import com.sms.inventory.StockUnitRepository;
import com.sms.pricing.StoreProductPrice;
import com.sms.pricing.StoreProductPriceRepository;
import com.sms.product.dto.ProductVariant;
import com.sms.product.repository.ProductVariantRepository;
import com.sms.sales.SalesOrder;
import com.sms.sales.SalesOrderItem;
import com.sms.sales.SalesOrderItemRepository;
import com.sms.sales.SalesOrderRepository;
import com.sms.sales.SalesOrderStatus;
import com.sms.pricing.PriceDiscountService;
import com.sms.pricing.dto.DiscountCalculationResult;
import com.sms.pricing.dto.CartDiscountLine;
import com.sms.pricing.dto.CartDiscountResult;
import com.sms.storefront.dto.CheckoutRequest;
import com.sms.storefront.dto.CheckoutResponse;
import com.sms.storefront.dto.StorefrontOrderDto;
import com.sms.storefront.model.FulfillmentGroup;
import com.sms.storefront.model.FulfillmentGroupItem;
import com.sms.storefront.model.StorefrontPaymentMethod;
import com.sms.storefront.repository.FulfillmentGroupItemRepository;
import com.sms.storefront.repository.FulfillmentGroupRepository;
import com.sms.storefront.repository.StorefrontPaymentMethodRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class StorefrontCheckoutService {

    private final SalesOrderRepository salesOrderRepository;
    private final SalesOrderItemRepository salesOrderItemRepository;
    private final FulfillmentGroupRepository fulfillmentGroupRepository;
    private final FulfillmentGroupItemRepository fulfillmentGroupItemRepository;
    private final StorefrontPaymentMethodRepository paymentMethodRepository;
    private final CustomerRepository customerRepository;
    private final CustomerAddressRepository customerAddressRepository;
    private final StoreRepository storeRepository;
    private final ProductVariantRepository productVariantRepository;
    private final StoreProductPriceRepository priceRepository;
    private final StockUnitRepository stockUnitRepository;
    private final StorefrontPushNotificationService pushNotificationService;
    private final PriceDiscountService discountService;

    public List<StorefrontPaymentMethod> getAvailablePaymentMethods() {
        return paymentMethodRepository.findByEnabledTrueOrderByDisplayOrderAsc();
    }

    public List<Store> getPickupBranches() {
        return storeRepository.findAll().stream().filter(Store::isActive).toList();
    }

    public CheckoutResponse processCheckout(CheckoutRequest request) {
        // 1. Resolve or Create Master Customer record
        Customer customer = resolveCustomer(request);

        // 2. Resolve Store
        Store store = resolveStore(request.pickupStoreId());

        // 3. Resolve Delivery Address if Home Delivery
        String fulfillmentMethod = (request.fulfillmentMethod() != null && !request.fulfillmentMethod().isBlank())
                ? request.fulfillmentMethod().toUpperCase() : "DELIVERY";
        CustomerAddress address = null;
        String addressSnapshot = "Pickup at Store: " + store.getName();

        if ("DELIVERY".equalsIgnoreCase(fulfillmentMethod) && request.deliveryAddress() != null) {
            CheckoutRequest.DeliveryAddressDto d = request.deliveryAddress();
            addressSnapshot = String.format("%s (%s), %s, %s, %s %s",
                    d.recipientName(), d.phone(), d.streetAddress(), d.city(),
                    d.province() != null ? d.province() : "", d.postalCode() != null ? d.postalCode() : "");

            address = new CustomerAddress();
            address.setCustomer(customer);
            address.setLabel("Online Delivery");
            address.setAddressLine(d.streetAddress() + ", " + d.city());
            address.setNotes("Online order delivery destination");
            address.setPrimary(true);
            address = customerAddressRepository.save(address);
        }

        // 4. Evaluate Items, Pricing, and Commercial Availability
        BigDecimal totalAmount = BigDecimal.ZERO;
        record ItemEvaluation(ProductVariant variant, int qty, BigDecimal basePrice, BigDecimal unitPrice, BigDecimal lineTotal, boolean requiresProcurement, String discountNote) {}
        List<ItemEvaluation> evaluatedItems = new ArrayList<>();
        List<CartDiscountLine> cartDiscountLines = new ArrayList<>();
        boolean anyRequiresProcurement = false;

        for (CheckoutRequest.CheckoutItemDto itemDto : request.items()) {
            ProductVariant variant = productVariantRepository.findById(itemDto.variantId())
                    .orElseThrow(() -> new com.sms.common.web.NotFoundException("Variant not found: " + itemDto.variantId()));

            BigDecimal basePrice = resolvePrice(variant);
            UUID prodId = variant.getProduct() != null ? variant.getProduct().getId() : null;
            DiscountCalculationResult dRes = discountService.calculateDiscount(store.getId(), variant.getId(), prodId, basePrice, itemDto.quantity());
            BigDecimal unitPrice = dRes.discountedPrice();
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(itemDto.quantity()));
            totalAmount = totalAmount.add(lineTotal);

            long stock = stockUnitRepository.countByProductVariantIdAndAvailabilityStatus(variant.getId(), StockAvailability.AVAILABLE);
            if (dRes.flashSale() && stock < itemDto.quantity()) {
                throw new com.sms.common.web.BusinessRuleException(
                        "Flash sale stock is limited to currently available units for " + variant.getSku());
            }
            boolean reqProc = stock < itemDto.quantity();
            if (reqProc) anyRequiresProcurement = true;

            String discNote = dRes.isDiscounted() ? ("Promo: " + dRes.appliedDiscountName() + " (-" + dRes.discountPercentage() + "%)") : null;
            evaluatedItems.add(new ItemEvaluation(variant, itemDto.quantity(), basePrice, unitPrice, lineTotal, reqProc, discNote));
            cartDiscountLines.add(new CartDiscountLine(variant.getId(), prodId, unitPrice, itemDto.quantity()));
        }

        CartDiscountResult cartDiscount = discountService.calculateCartDiscount(store.getId(), cartDiscountLines);
        totalAmount = totalAmount.subtract(cartDiscount.discountAmount()).max(BigDecimal.ZERO);

        // Add 11% tax
        BigDecimal tax = totalAmount.multiply(BigDecimal.valueOf(0.11)).setScale(0, java.math.RoundingMode.HALF_UP);
        BigDecimal grandTotal = totalAmount.add(tax);

        // 5. Deposit-First Calculation
        // If items require procurement, mandatory 30% deposit is required before supplier PO can proceed
        BigDecimal requiredDeposit = BigDecimal.ZERO;
        if (anyRequiresProcurement) {
            requiredDeposit = grandTotal.multiply(BigDecimal.valueOf(0.30)).setScale(0, java.math.RoundingMode.HALF_UP);
        } else if ("QRIS".equalsIgnoreCase(request.paymentMethod()) || "BANK_TRANSFER_VA".equalsIgnoreCase(request.paymentMethod())) {
            requiredDeposit = grandTotal; // Full payment for digital instant checkouts
        }

        // 6. Create Sales Order
        String orderSource = (request.orderSource() != null && !request.orderSource().isBlank())
                ? request.orderSource().toUpperCase() : "ONLINE_WEB";
        String fulfillmentPreference = (request.fulfillmentPreference() != null && !request.fulfillmentPreference().isBlank())
                ? request.fulfillmentPreference().toUpperCase() : "COMPLETE";

        String orderNum = "SO-" + (orderSource.contains("APP") ? "APP" : "WEB") + "-"
                + System.currentTimeMillis() % 10000000;

        SalesOrder order = new SalesOrder();
        order.setNumber(orderNum);
        order.setStore(store);
        order.setCustomer(customer);
        order.setDeliveryAddress(address);
        order.setDeliveryAddressSnapshot(addressSnapshot);
        order.setStatus(SalesOrderStatus.CONFIRMED);
        order.setOrderSource(orderSource);
        order.setFulfillmentPreference(fulfillmentPreference);
        order.setRequiredDepositAmount(requiredDeposit);
        order.setDepositPaid(false);
        order.setPaymentMethod(request.paymentMethod());
        order.setTotalAmount(grandTotal);
        order.setOrderDiscountAmount(cartDiscount.discountAmount());
        order.setCustomerNotes(request.customerNotes());
        if (cartDiscount.discountName() != null) {
            order.setCustomerNotes(appendNote(order.getCustomerNotes(), "Promo keranjang: " + cartDiscount.discountName()));
        }
        order = salesOrderRepository.save(order);

        // 7. Create SalesOrderItems
        List<SalesOrderItem> orderItems = new ArrayList<>();
        for (ItemEvaluation eval : evaluatedItems) {
            SalesOrderItem soItem = new SalesOrderItem();
            soItem.setSalesOrder(order);
            soItem.setProductVariant(eval.variant());
            soItem.setQuantity(eval.qty());
            soItem.setPaymentTermMonths(0);
            soItem.setReferencePrice(eval.basePrice());
            soItem.setFinalPrice(eval.unitPrice());
            String note = (eval.requiresProcurement() ? "Procurement Required" : "Ready in Stock") + (eval.discountNote() != null ? " | " + eval.discountNote() : "");
            soItem.setNotes(note);
            orderItems.add(salesOrderItemRepository.save(soItem));
        }

        // 8. Dual-Axis Fulfillment Engine: Create Fulfillment Groups & Items
        List<CheckoutResponse.FulfillmentGroupSummaryDto> groupSummaries = new ArrayList<>();

        if ("PARTIAL".equalsIgnoreCase(fulfillmentPreference) && anyRequiresProcurement) {
            // Split into two groups: Group 1 for In-Stock items, Group 2 for Indent items
            List<ItemEvaluation> inStockEvals = new ArrayList<>();
            List<ItemEvaluation> indentEvals = new ArrayList<>();
            for (int i = 0; i < evaluatedItems.size(); i++) {
                if (evaluatedItems.get(i).requiresProcurement()) {
                    indentEvals.add(evaluatedItems.get(i));
                } else {
                    inStockEvals.add(evaluatedItems.get(i));
                }
            }

            // Group 1: In-Stock Immediate Fulfillment
            if (!inStockEvals.isEmpty()) {
                FulfillmentGroup fg1 = new FulfillmentGroup();
                fg1.setSalesOrder(order);
                fg1.setGroupNumber(1);
                fg1.setFulfillmentMethod(fulfillmentMethod);
                fg1.setPickupStore("PICKUP".equalsIgnoreCase(fulfillmentMethod) ? store : null);
                if ("PICKUP".equalsIgnoreCase(fulfillmentMethod)) {
                    String suffix = order.getNumber().length() > 4 ? order.getNumber().substring(order.getNumber().length() - 4) : "8888";
                    String pass = "PKP-" + (1000 + (int)(Math.random() * 9000)) + "-" + suffix;
                    fg1.setPickupPassCode(pass);
                    fg1.setPickupQrPayload("SMS-PICKUP:" + order.getNumber() + ":1:" + pass);
                    fg1.setStagingRackLocation("Area Penyiapan Showroom");
                }
                fg1.setStatus("PICKUP".equalsIgnoreCase(fulfillmentMethod) ? "READY_FOR_PICKUP" : "READY_FOR_PACKING");
                fg1.setEstimatedDeliveryDate(Instant.now().plus(1, ChronoUnit.DAYS));
                fg1.setNotes("In-stock items ready for immediate dispatch/pickup");
                fg1 = fulfillmentGroupRepository.save(fg1);

                List<CheckoutResponse.FulfillmentItemDto> itemsFg1 = new ArrayList<>();
                for (ItemEvaluation ev : inStockEvals) {
                    SalesOrderItem linkedItem = findSoItem(orderItems, ev.variant().getId());
                    FulfillmentGroupItem fgi = new FulfillmentGroupItem();
                    fgi.setFulfillmentGroup(fg1);
                    fgi.setSalesOrderItem(linkedItem);
                    fgi.setQuantity(ev.qty());
                    fgi.setProcurementRequired(false);
                    fgi.setProcurementStatus("NONE");
                    fulfillmentGroupItemRepository.save(fgi);

                    itemsFg1.add(new CheckoutResponse.FulfillmentItemDto(
                            ev.variant().getProduct().getName(),
                            ev.variant().getVariantName(),
                            ev.variant().getSku(),
                            ev.qty(),
                            false,
                            "READY_IN_STOCK"
                    ));
                }
                groupSummaries.add(new CheckoutResponse.FulfillmentGroupSummaryDto(
                        fg1.getId(), 1, fg1.getFulfillmentMethod(), fg1.getStatus(),
                        store.getName(), fg1.getEstimatedDeliveryDate(), itemsFg1
                ));
            }

            // Group 2: Procurement Required Backorder Fulfillment
            if (!indentEvals.isEmpty()) {
                FulfillmentGroup fg2 = new FulfillmentGroup();
                fg2.setSalesOrder(order);
                fg2.setGroupNumber(2);
                fg2.setFulfillmentMethod(fulfillmentMethod);
                fg2.setPickupStore("PICKUP".equalsIgnoreCase(fulfillmentMethod) ? store : null);
                if ("PICKUP".equalsIgnoreCase(fulfillmentMethod)) {
                    String suffix = order.getNumber().length() > 4 ? order.getNumber().substring(order.getNumber().length() - 4) : "8888";
                    String pass = "PKP-" + (1000 + (int)(Math.random() * 9000)) + "-" + suffix;
                    fg2.setPickupPassCode(pass);
                    fg2.setPickupQrPayload("SMS-PICKUP:" + order.getNumber() + ":2:" + pass);
                    fg2.setStagingRackLocation("Area Pengadaan Showroom");
                }
                fg2.setStatus("AWAITING_PROCUREMENT");
                fg2.setEstimatedDeliveryDate(Instant.now().plus(4, ChronoUnit.DAYS));
                fg2.setNotes("Supplier procurement backorder (Deposit required before supplier PO issuance)");
                fg2 = fulfillmentGroupRepository.save(fg2);

                List<CheckoutResponse.FulfillmentItemDto> itemsFg2 = new ArrayList<>();
                for (ItemEvaluation ev : indentEvals) {
                    SalesOrderItem linkedItem = findSoItem(orderItems, ev.variant().getId());
                    FulfillmentGroupItem fgi = new FulfillmentGroupItem();
                    fgi.setFulfillmentGroup(fg2);
                    fgi.setSalesOrderItem(linkedItem);
                    fgi.setQuantity(ev.qty());
                    fgi.setProcurementRequired(true);
                    fgi.setProcurementStatus("AWAITING_DEPOSIT");
                    fulfillmentGroupItemRepository.save(fgi);

                    itemsFg2.add(new CheckoutResponse.FulfillmentItemDto(
                            ev.variant().getProduct().getName(),
                            ev.variant().getVariantName(),
                            ev.variant().getSku(),
                            ev.qty(),
                            true,
                            "AWAITING_DEPOSIT"
                    ));
                }
                groupSummaries.add(new CheckoutResponse.FulfillmentGroupSummaryDto(
                        fg2.getId(), 2, fg2.getFulfillmentMethod(), fg2.getStatus(),
                        store.getName(), fg2.getEstimatedDeliveryDate(), itemsFg2
                ));
            }
        } else {
            // COMPLETE fulfillment (Single Fulfillment Group - Wait for all items)
            FulfillmentGroup fg = new FulfillmentGroup();
            fg.setSalesOrder(order);
            fg.setGroupNumber(1);
            fg.setFulfillmentMethod(fulfillmentMethod);
            fg.setPickupStore("PICKUP".equalsIgnoreCase(fulfillmentMethod) ? store : null);
            if ("PICKUP".equalsIgnoreCase(fulfillmentMethod)) {
                String suffix = order.getNumber().length() > 4 ? order.getNumber().substring(order.getNumber().length() - 4) : "8888";
                String pass = "PKP-" + (1000 + (int)(Math.random() * 9000)) + "-" + suffix;
                fg.setPickupPassCode(pass);
                fg.setPickupQrPayload("SMS-PICKUP:" + order.getNumber() + ":1:" + pass);
                fg.setStagingRackLocation(anyRequiresProcurement ? "Area Pengadaan Showroom" : "Area Penyiapan Showroom");
            }
            fg.setStatus(anyRequiresProcurement ? "AWAITING_PROCUREMENT" :
                    ("PICKUP".equalsIgnoreCase(fulfillmentMethod) ? "READY_FOR_PICKUP" : "READY_FOR_PACKING"));
            fg.setEstimatedDeliveryDate(Instant.now().plus(anyRequiresProcurement ? 5 : 1, ChronoUnit.DAYS));
            fg.setNotes(anyRequiresProcurement ? "Complete delivery: waiting for procurement items to arrive" : "Ready for dispatch");
            fg = fulfillmentGroupRepository.save(fg);

            List<CheckoutResponse.FulfillmentItemDto> itemsFg = new ArrayList<>();
            for (int i = 0; i < evaluatedItems.size(); i++) {
                ItemEvaluation ev = evaluatedItems.get(i);
                SalesOrderItem linkedItem = orderItems.get(i);
                FulfillmentGroupItem fgi = new FulfillmentGroupItem();
                fgi.setFulfillmentGroup(fg);
                fgi.setSalesOrderItem(linkedItem);
                fgi.setQuantity(ev.qty());
                fgi.setProcurementRequired(ev.requiresProcurement());
                fgi.setProcurementStatus(ev.requiresProcurement() ? "AWAITING_DEPOSIT" : "NONE");
                fulfillmentGroupItemRepository.save(fgi);

                itemsFg.add(new CheckoutResponse.FulfillmentItemDto(
                        ev.variant().getProduct().getName(),
                        ev.variant().getVariantName(),
                        ev.variant().getSku(),
                        ev.qty(),
                        ev.requiresProcurement(),
                        ev.requiresProcurement() ? "AWAITING_DEPOSIT" : "READY_IN_STOCK"
                ));
            }
            groupSummaries.add(new CheckoutResponse.FulfillmentGroupSummaryDto(
                    fg.getId(), 1, fg.getFulfillmentMethod(), fg.getStatus(),
                    store.getName(), fg.getEstimatedDeliveryDate(), itemsFg
            ));
        }

        // 9. Generate Payment Instructions
        CheckoutResponse.PaymentInstructionDto paymentInstructions = generatePaymentInstructions(
                request.paymentMethod(), grandTotal, requiredDeposit, order.getNumber()
        );

        return new CheckoutResponse(
                order.getId(),
                order.getNumber(),
                order.getStatus().name(),
                grandTotal,
                requiredDeposit,
                order.isDepositPaid(),
                order.getPaymentMethod(),
                order.getOrderDiscountAmount(),
                cartDiscount.discountName(),
                paymentInstructions,
                fulfillmentPreference,
                groupSummaries
        );
    }

    public StorefrontOrderDto simulatePayment(UUID orderId) {
        SalesOrder order = salesOrderRepository.findById(orderId)
                .orElseThrow(() -> new com.sms.common.web.NotFoundException("Order not found: " + orderId));

        order.setDepositPaid(true);
        salesOrderRepository.save(order);

        // Update fulfillment groups: unblock procurement now that deposit is verified
        List<FulfillmentGroup> groups = fulfillmentGroupRepository.findBySalesOrderIdOrderByGroupNumberAsc(orderId);
        for (FulfillmentGroup g : groups) {
            if ("AWAITING_PROCUREMENT".equalsIgnoreCase(g.getStatus())) {
                g.setStatus("READY_FOR_PACKING");
                g.setNotes("Customer deposit verified. Procurement authorized and committed.");
                fulfillmentGroupRepository.save(g);
            }
        }

        // Trigger milestone push notification to customer
        try {
            pushNotificationService.sendMilestoneNotification(
                    order.getNumber(),
                    "DEPOSIT_CONFIRMED",
                    null,
                    null,
                    java.util.Map.of("amount", order.getRequiredDepositAmount() != null ? order.getRequiredDepositAmount() : order.getTotalAmount())
            );
        } catch (Exception e) {
            // Push notification failure should not rollback payment simulation
        }

        return getOrderDto(order);
    }

    public StorefrontOrderDto getOrder(UUID orderId) {
        SalesOrder order = salesOrderRepository.findById(orderId)
                .orElseThrow(() -> new com.sms.common.web.NotFoundException("Order not found: " + orderId));
        return getOrderDto(order);
    }

    public StorefrontOrderDto getOrderByNumber(String orderNumber) {
        SalesOrder order = salesOrderRepository.findByNumber(orderNumber)
                .orElseThrow(() -> new com.sms.common.web.NotFoundException("Order not found with number: " + orderNumber));
        return getOrderDto(order);
    }

    public List<StorefrontOrderDto> listOrders(String email, String phone) {
        List<SalesOrder> orders = salesOrderRepository.findAll();
        List<StorefrontOrderDto> result = new ArrayList<>();
        for (SalesOrder o : orders) {
            if (o.getCustomer() != null) {
                boolean match = false;
                if (email != null && email.equalsIgnoreCase(o.getCustomer().getPrimaryEmail())) match = true;
                if (phone != null && phone.equalsIgnoreCase(o.getCustomer().getPrimaryPhone())) match = true;
                if (match || (email == null && phone == null)) {
                    result.add(getOrderDto(o));
                }
            }
        }
        return result;
    }

    private StorefrontOrderDto getOrderDto(SalesOrder order) {
        List<FulfillmentGroup> groups = fulfillmentGroupRepository.findBySalesOrderIdOrderByGroupNumberAsc(order.getId());
        List<CheckoutResponse.FulfillmentGroupSummaryDto> groupDtos = new ArrayList<>();

        for (FulfillmentGroup g : groups) {
            List<FulfillmentGroupItem> items = fulfillmentGroupItemRepository.findByFulfillmentGroupId(g.getId());
            List<CheckoutResponse.FulfillmentItemDto> itemDtos = new ArrayList<>();
            for (FulfillmentGroupItem fgi : items) {
                ProductVariant v = fgi.getSalesOrderItem().getProductVariant();
                itemDtos.add(new CheckoutResponse.FulfillmentItemDto(
                        v.getProduct() != null ? v.getProduct().getName() : "Product",
                        v.getVariantName(),
                        v.getSku(),
                        fgi.getQuantity(),
                        fgi.isProcurementRequired(),
                        fgi.getProcurementStatus()
                ));
            }
            groupDtos.add(new CheckoutResponse.FulfillmentGroupSummaryDto(
                    g.getId(), g.getGroupNumber(), g.getFulfillmentMethod(), g.getStatus(),
                    g.getPickupStore() != null ? g.getPickupStore().getName() : "Central Dispatch",
                    g.getEstimatedDeliveryDate(), itemDtos
            ));
        }

        Instant createdAt = order.getCreatedAt() != null ? order.getCreatedAt() : Instant.now();
        List<StorefrontOrderDto.OrderTimelineEventDto> timeline = new ArrayList<>();
        timeline.add(new StorefrontOrderDto.OrderTimelineEventDto("ORDER_PLACED", "Pesanan Berhasil Dibuat", createdAt, true));
        timeline.add(new StorefrontOrderDto.OrderTimelineEventDto("PAYMENT_CONFIRMED", "Pembayaran / Uang Muka Terkonfirmasi", createdAt.plus(5, ChronoUnit.MINUTES), order.isDepositPaid()));
        timeline.add(new StorefrontOrderDto.OrderTimelineEventDto("PREPARATION", "Persiapan Barang di Gudang / Pengadaan Distributor", createdAt.plus(1, ChronoUnit.HOURS), order.isDepositPaid()));
        timeline.add(new StorefrontOrderDto.OrderTimelineEventDto("DISPATCHED", "Pesanan Dikirim / Siap Diambil di Toko", createdAt.plus(1, ChronoUnit.DAYS), false));
        timeline.add(new StorefrontOrderDto.OrderTimelineEventDto("COMPLETED", "Pesanan Diterima Selesai", createdAt.plus(2, ChronoUnit.DAYS), false));

        return new StorefrontOrderDto(
                order.getId(),
                order.getNumber(),
                createdAt,
                order.getStatus().name(),
                order.getTotalAmount(),
                order.getOrderDiscountAmount(),
                extractOrderDiscountLabel(order.getCustomerNotes()),
                order.getRequiredDepositAmount(),
                order.isDepositPaid(),
                order.getPaymentMethod(),
                order.getFulfillmentPreference(),
                order.getCustomer() != null ? order.getCustomer().getFullName() : "Customer",
                order.getCustomer() != null ? order.getCustomer().getPrimaryPhone() : "-",
                order.getDeliveryAddressSnapshot(),
                order.getCustomerNotes(),
                groupDtos,
                timeline
        );
    }

    private Customer resolveCustomer(CheckoutRequest request) {
        if (request.customerEmail() != null && !request.customerEmail().isBlank()) {
            List<Customer> found = customerRepository.search(request.customerEmail());
            if (!found.isEmpty()) return found.get(0);
        }
        if (request.customerPhone() != null && !request.customerPhone().isBlank()) {
            List<Customer> found = customerRepository.search(request.customerPhone());
            if (!found.isEmpty()) return found.get(0);
        }

        Customer newCust = new Customer();
        newCust.setFullName(request.customerName());
        newCust.setPrimaryEmail(request.customerEmail());
        newCust.setPrimaryPhone(request.customerPhone());
        newCust.setNik("NIK-" + System.currentTimeMillis() % 100000000);
        newCust.setSegment("ONLINE_RETAIL");
        newCust.setCreditScoreGrade("B");
        newCust.setCreditScorePoints(80);
        return customerRepository.save(newCust);
    }

    private String appendNote(String existing, String addition) {
        return existing == null || existing.isBlank() ? addition : existing + " | " + addition;
    }

    private String extractOrderDiscountLabel(String notes) {
        if (notes == null) return null;
        String marker = "Promo keranjang: ";
        int index = notes.indexOf(marker);
        return index < 0 ? null : notes.substring(index + marker.length()).split(" \\| ", 2)[0];
    }

    private Store resolveStore(UUID pickupStoreId) {
        if (pickupStoreId != null) {
            Optional<Store> st = storeRepository.findById(pickupStoreId);
            if (st.isPresent()) return st.get();
        }
        List<Store> stores = storeRepository.findAll();
        if (!stores.isEmpty()) return stores.get(0);

        Store defaultStore = new Store();
        defaultStore.setCode("STORE-ONLINE");
        defaultStore.setName("SMS Mart Flagship Showroom");
        defaultStore.setAddress("Jl. Sudirman No. 42, Jakarta Pusat");
        return storeRepository.save(defaultStore);
    }

    private SalesOrderItem findSoItem(List<SalesOrderItem> items, UUID variantId) {
        for (SalesOrderItem item : items) {
            if (item.getProductVariant().getId().equals(variantId)) {
                return item;
            }
        }
        return items.get(0);
    }

    private BigDecimal resolvePrice(ProductVariant variant) {
        if (variant == null) return BigDecimal.valueOf(1500000);
        if (variant.getId() != null) {
            Optional<StoreProductPrice> priceOpt = priceRepository.findFirstByProductVariantIdAndActiveTrue(variant.getId());
            if (priceOpt.isPresent()) {
                return priceOpt.get().getCashPrice();
            }
        }
        int hash = variant.getId() != null ? Math.abs(variant.getId().hashCode()) : Math.abs(variant.getSku() != null ? variant.getSku().hashCode() : 42);
        long basePrice = 500000L + (hash % 4500000L);
        return BigDecimal.valueOf((basePrice / 50000L) * 50000L);
    }

    private CheckoutResponse.PaymentInstructionDto generatePaymentInstructions(
            String method, BigDecimal grandTotal, BigDecimal deposit, String orderNum) {
        BigDecimal due = deposit.compareTo(BigDecimal.ZERO) > 0 ? deposit : grandTotal;
        String m = method != null ? method.toUpperCase() : "QRIS";

        if ("QRIS".equalsIgnoreCase(m)) {
            String qrisPayload = "00020101021226680016ID.CO.SMSMART.WWW011893600914"
                    + orderNum + "520458125303360540" + due.intValue() + "5802ID5914SMS_MART_STORE6007JAKARTA6304ABCD";
            return new CheckoutResponse.PaymentInstructionDto(
                    "QRIS", qrisPayload, null, null, due,
                    Instant.now().plus(24, ChronoUnit.HOURS),
                    "Scan kode QRIS ini dengan aplikasi mobile banking atau e-wallet Anda (BCA Mobile, Livin, GoPay, OVO, Dana)."
            );
        } else if ("BANK_TRANSFER_VA".equalsIgnoreCase(m)) {
            String va = "8808" + (Math.abs(orderNum.hashCode()) % 1000000000L);
            return new CheckoutResponse.PaymentInstructionDto(
                    "BANK_TRANSFER_VA", null, va, "BCA / Mandiri Virtual Account", due,
                    Instant.now().plus(24, ChronoUnit.HOURS),
                    "Transfer ke nomor Virtual Account di atas sebelum batas waktu berakhir untuk konfirmasi pembayaran otomatis."
            );
        } else if ("COD_DRIVER".equalsIgnoreCase(m)) {
            return new CheckoutResponse.PaymentInstructionDto(
                    "COD_DRIVER", null, null, null, grandTotal,
                    Instant.now().plus(48, ChronoUnit.HOURS),
                    "Siapkan uang tunai pas sejumlah tagihan untuk diserahkan langsung kepada kurir pengemudi toko kami saat pesanan tiba."
            );
        } else {
            return new CheckoutResponse.PaymentInstructionDto(
                    m, null, "SMS-PAY-" + System.currentTimeMillis() % 100000, "Official Channel", due,
                    Instant.now().plus(24, ChronoUnit.HOURS),
                    "Selesaikan pembayaran melalui metode " + m + " pilihan Anda."
            );
        }
    }
}
