package com.sms.storefront.service;

import com.sms.common.web.NotFoundException;
import com.sms.foundation.store.Store;
import com.sms.product.dto.ProductVariant;
import com.sms.sales.SalesOrder;
import com.sms.sales.SalesOrderRepository;
import com.sms.sales.SalesOrderStatus;
import com.sms.storefront.dto.HandoverVerificationResultDto;
import com.sms.storefront.dto.StagePickupRequest;
import com.sms.storefront.dto.StorefrontPickupPassDto;
import com.sms.storefront.dto.VerifyHandoverRequest;
import com.sms.storefront.model.FulfillmentGroup;
import com.sms.storefront.model.FulfillmentGroupItem;
import com.sms.storefront.repository.FulfillmentGroupItemRepository;
import com.sms.storefront.repository.FulfillmentGroupRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class StorefrontPickupService {

    private final FulfillmentGroupRepository fulfillmentGroupRepository;
    private final FulfillmentGroupItemRepository fulfillmentGroupItemRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final StorefrontPushNotificationService pushNotificationService;

    private static final Random RANDOM = new Random();

    @Transactional(readOnly = true)
    public StorefrontPickupPassDto getPickupPass(String orderNumber) {
        SalesOrder order = salesOrderRepository.findByNumber(orderNumber)
                .orElseThrow(() -> new NotFoundException("Pesanan tidak ditemukan dengan nomor: " + orderNumber));

        List<FulfillmentGroup> groups = fulfillmentGroupRepository.findBySalesOrderIdOrderByGroupNumberAsc(order.getId());
        FulfillmentGroup pickupGroup = groups.stream()
                .filter(g -> "PICKUP".equalsIgnoreCase(g.getFulfillmentMethod()))
                .findFirst()
                .orElse(null);

        if (pickupGroup == null) {
            // If no explicit PICKUP group exists, return first group as fallback
            pickupGroup = groups.isEmpty() ? null : groups.get(0);
        }

        if (pickupGroup == null) {
            throw new NotFoundException("Tidak ada alokasi pengiriman ditemukan untuk pesanan: " + orderNumber);
        }

        ensurePassCodeGenerated(pickupGroup, order.getNumber());
        return mapToPassDto(pickupGroup, order);
    }

    public StorefrontPickupPassDto stagePickupGroup(StagePickupRequest request) {
        FulfillmentGroup group = resolveFulfillmentGroup(request.getFulfillmentGroupId(), request.getOrderNumber(), request.getGroupNumber());
        SalesOrder order = group.getSalesOrder();

        group.setStagingRackLocation(request.getStagingRackLocation());
        group.setStagedByStaffName(request.getStagedByStaffName() != null && !request.getStagedByStaffName().isBlank()
                ? request.getStagedByStaffName() : "Staging Showroom Staff");
        group.setStagedAt(Instant.now());
        group.setStatus("READY_FOR_PICKUP");

        ensurePassCodeGenerated(group, order.getNumber());

        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            String existingNotes = group.getNotes() != null ? group.getNotes() + "; " : "";
            group.setNotes(existingNotes + "Staging: " + request.getNotes());
        }

        FulfillmentGroup saved = fulfillmentGroupRepository.save(group);
        log.info("Pickup fulfillment group {} staged at {} by {}", saved.getId(), saved.getStagingRackLocation(), saved.getStagedByStaffName());

        // Trigger customer push notification
        try {
            pushNotificationService.sendMilestoneNotification(
                    order.getNumber(),
                    "STORE_PICKUP_READY",
                    "Pesanan Siap Diambil di Cabang",
                    "Pesanan Anda #" + order.getNumber() + " sudah selesai disiapkan di " +
                            (saved.getPickupStore() != null ? saved.getPickupStore().getName() : "Showroom") +
                            " (Lokasi: " + saved.getStagingRackLocation() + "). Silakan tunjukkan QR Code / Kode Pengambilan di kasir.",
                    java.util.Map.of("pickupPassCode", saved.getPickupPassCode() != null ? saved.getPickupPassCode() : "")
            );
        } catch (Exception e) {
            log.warn("Failed to dispatch push notification for staged order {}: {}", order.getNumber(), e.getMessage());
        }

        return mapToPassDto(saved, order);
    }

    public HandoverVerificationResultDto verifyHandover(VerifyHandoverRequest request) {
        String cleanCode = cleanPickupPassCode(request.getPickupPassCode());

        Optional<FulfillmentGroup> groupOpt = fulfillmentGroupRepository.findByPickupPassCode(cleanCode);
        if (groupOpt.isEmpty()) {
            // Also check if code is an order number
            Optional<SalesOrder> orderOpt = salesOrderRepository.findByNumber(cleanCode);
            if (orderOpt.isPresent()) {
                List<FulfillmentGroup> grps = fulfillmentGroupRepository.findBySalesOrderIdOrderByGroupNumberAsc(orderOpt.get().getId());
                groupOpt = grps.stream().filter(g -> "PICKUP".equalsIgnoreCase(g.getFulfillmentMethod())).findFirst();
            }
        }

        FulfillmentGroup group = groupOpt.orElseThrow(() ->
                new NotFoundException("Kode verifikasi atau tiket pengambilan tidak valid: " + request.getPickupPassCode()));

        SalesOrder order = group.getSalesOrder();

        if ("COMPLETED".equalsIgnoreCase(group.getStatus())) {
            throw new IllegalStateException("Pesanan #" + order.getNumber() + " sudah selesai diserahterimakan pada "
                    + group.getHandedOverAt() + " oleh " + group.getHandedOverByStaffName());
        }

        // Validate readiness
        if (!"READY_FOR_PICKUP".equalsIgnoreCase(group.getStatus()) && !"READY_FOR_PACKING".equalsIgnoreCase(group.getStatus())) {
            throw new IllegalStateException("Barang belum siap diserahkan (Status saat ini: " + group.getStatus()
                    + "). Pastikan petugas toko telah menyelesaikan staging barang terlebih dahulu.");
        }

        // Money Management: Settle remaining balance if customer pays at counter upon pickup
        BigDecimal totalAmount = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal requiredDeposit = order.getRequiredDepositAmount() != null ? order.getRequiredDepositAmount() : BigDecimal.ZERO;
        BigDecimal settledAmount = BigDecimal.ZERO;

        if (!order.isDepositPaid() || request.isSettleRemainingBalance() || requiredDeposit.compareTo(totalAmount) < 0) {
            if (order.isDepositPaid()) {
                settledAmount = totalAmount.subtract(requiredDeposit).max(BigDecimal.ZERO);
            } else {
                settledAmount = totalAmount;
            }
            order.setDepositPaid(true);
            salesOrderRepository.save(order);
            log.info("Settled remaining balance {} for order {} at showroom pickup counter", settledAmount, order.getNumber());
        }

        // Complete the fulfillment group
        group.setStatus("COMPLETED");
        group.setHandedOverAt(Instant.now());
        group.setHandedOverByStaffName(request.getStaffEmployeeName());
        group.setHandoverRecipientName(request.getRecipientIdentityName() != null && !request.getRecipientIdentityName().isBlank()
                ? request.getRecipientIdentityName() : (order.getCustomer() != null ? order.getCustomer().getFullName() : "Customer"));
        group.setHandoverRecipientPhone(request.getRecipientPhone());
        group.setHandoverNotes(request.getHandoverNotes());

        FulfillmentGroup savedGroup = fulfillmentGroupRepository.save(group);

        // Check if all groups are completed
        List<FulfillmentGroup> allGroups = fulfillmentGroupRepository.findBySalesOrderIdOrderByGroupNumberAsc(order.getId());
        boolean allCompleted = allGroups.stream().allMatch(g -> "COMPLETED".equalsIgnoreCase(g.getStatus()));
        if (allCompleted) {
            order.setStatus(SalesOrderStatus.COMPLETED);
            salesOrderRepository.save(order);
        }

        return HandoverVerificationResultDto.builder()
                .success(true)
                .orderNumber(order.getNumber())
                .groupNumber(savedGroup.getGroupNumber())
                .fulfillmentGroupId(savedGroup.getId())
                .pickupPassCode(savedGroup.getPickupPassCode())
                .handedOverAt(savedGroup.getHandedOverAt())
                .staffEmployeeName(savedGroup.getHandedOverByStaffName())
                .customerName(order.getCustomer() != null ? order.getCustomer().getFullName() : "Customer")
                .recipientIdentityName(savedGroup.getHandoverRecipientName())
                .settledAmount(settledAmount)
                .message("Verifikasi serah terima pesanan #" + order.getNumber() + " berhasil diselesaikan. Status pesanan telah diperbarui menjadi COMPLETED.")
                .build();
    }

    private FulfillmentGroup resolveFulfillmentGroup(UUID groupId, String orderNumber, Integer groupNumber) {
        if (groupId != null) {
            return fulfillmentGroupRepository.findById(groupId)
                    .orElseThrow(() -> new NotFoundException("Fulfillment group tidak ditemukan: " + groupId));
        }
        if (orderNumber != null && groupNumber != null) {
            return fulfillmentGroupRepository.findBySalesOrderNumberAndGroupNumber(orderNumber, groupNumber)
                    .orElseThrow(() -> new NotFoundException("Fulfillment group tidak ditemukan untuk order " + orderNumber + " group " + groupNumber));
        }
        if (orderNumber != null) {
            SalesOrder order = salesOrderRepository.findByNumber(orderNumber)
                    .orElseThrow(() -> new NotFoundException("Pesanan tidak ditemukan: " + orderNumber));
            List<FulfillmentGroup> list = fulfillmentGroupRepository.findBySalesOrderIdOrderByGroupNumberAsc(order.getId());
            return list.stream().filter(g -> "PICKUP".equalsIgnoreCase(g.getFulfillmentMethod())).findFirst()
                    .orElse(list.isEmpty() ? null : list.get(0));
        }
        throw new IllegalArgumentException("Identitas fulfillment group atau nomor pesanan harus disertakan");
    }

    private void ensurePassCodeGenerated(FulfillmentGroup group, String orderNumber) {
        if (group.getPickupPassCode() == null || group.getPickupPassCode().isBlank()) {
            int token = 1000 + RANDOM.nextInt(9000);
            String orderSuffix = orderNumber.length() > 4 ? orderNumber.substring(orderNumber.length() - 4) : "8888";
            String passCode = "PKP-" + token + "-" + orderSuffix;
            group.setPickupPassCode(passCode);
            group.setPickupQrPayload("SMS-PICKUP:" + orderNumber + ":" + group.getGroupNumber() + ":" + passCode);
            fulfillmentGroupRepository.save(group);
        }
    }

    private StorefrontPickupPassDto mapToPassDto(FulfillmentGroup group, SalesOrder order) {
        Store store = group.getPickupStore() != null ? group.getPickupStore() : order.getStore();
        BigDecimal total = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal deposit = order.getRequiredDepositAmount() != null ? order.getRequiredDepositAmount() : BigDecimal.ZERO;

        BigDecimal remainingBalance;
        boolean fullyPaid;

        if (order.isDepositPaid()) {
            if (deposit.compareTo(total) >= 0 || deposit.compareTo(BigDecimal.ZERO) == 0) {
                remainingBalance = BigDecimal.ZERO;
                fullyPaid = true;
            } else {
                remainingBalance = total.subtract(deposit).max(BigDecimal.ZERO);
                fullyPaid = remainingBalance.compareTo(BigDecimal.ZERO) == 0;
            }
        } else {
            remainingBalance = total;
            fullyPaid = false;
        }

        List<FulfillmentGroupItem> groupItems = fulfillmentGroupItemRepository.findByFulfillmentGroupId(group.getId());
        List<StorefrontPickupPassDto.PickupItemDto> items = new ArrayList<>();
        for (FulfillmentGroupItem gi : groupItems) {
            ProductVariant v = gi.getSalesOrderItem().getProductVariant();
            items.add(new StorefrontPickupPassDto.PickupItemDto(
                    v.getProduct() != null ? v.getProduct().getName() : "Product",
                    v.getVariantName(),
                    v.getSku(),
                    gi.getQuantity(),
                    gi.isProcurementRequired()
            ));
        }

        boolean isReady = "READY_FOR_PICKUP".equalsIgnoreCase(group.getStatus()) && order.isDepositPaid();

        return StorefrontPickupPassDto.builder()
                .orderNumber(order.getNumber())
                .fulfillmentGroupId(group.getId())
                .groupNumber(group.getGroupNumber())
                .pickupStoreId(store != null ? store.getId() : null)
                .pickupStoreCode(store != null ? store.getCode() : "SHOWROOM-01")
                .pickupStoreName(store != null ? store.getName() : "SMS Mart Flagship Showroom")
                .pickupStoreAddress(store != null && store.getAddress() != null ? store.getAddress() : "Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan")
                .operatingHours("Senin - Minggu: 09:00 - 21:00 WIB")
                .contactPhone("+62 21 555-0199")
                .pickupPassCode(group.getPickupPassCode())
                .qrPayload(group.getPickupQrPayload())
                .stagingStatus(group.getStatus())
                .stagingRackLocation(group.getStagingRackLocation() != null ? group.getStagingRackLocation() : "Area Staging Showroom")
                .stagedAt(group.getStagedAt())
                .handedOverAt(group.getHandedOverAt())
                .handedOverByStaffName(group.getHandedOverByStaffName())
                .recipientName(order.getCustomer() != null ? order.getCustomer().getFullName() : "Customer")
                .recipientPhone(order.getCustomer() != null ? order.getCustomer().getPrimaryPhone() : "-")
                .totalAmount(total)
                .requiredDepositAmount(deposit)
                .depositPaid(order.isDepositPaid())
                .remainingBalance(remainingBalance)
                .fullyPaid(fullyPaid)
                .readyForCollection(isReady)
                .items(items)
                .build();
    }

    private String cleanPickupPassCode(String raw) {
        if (raw == null) return "";
        String trimmed = raw.trim();
        if (trimmed.startsWith("SMS-PICKUP:")) {
            String[] parts = trimmed.split(":");
            if (parts.length >= 4) {
                return parts[3];
            }
        }
        return trimmed;
    }
}
