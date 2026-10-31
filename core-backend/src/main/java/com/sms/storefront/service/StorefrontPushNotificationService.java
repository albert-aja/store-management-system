package com.sms.storefront.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sms.sales.SalesOrder;
import com.sms.sales.SalesOrderRepository;
import com.sms.storefront.dto.DeviceTokenRegisterRequest;
import com.sms.storefront.dto.StorefrontNotificationDto;
import com.sms.storefront.model.CustomerDeviceToken;
import com.sms.storefront.model.StorefrontCustomer;
import com.sms.storefront.model.StorefrontPushNotificationLog;
import com.sms.storefront.repository.CustomerDeviceTokenRepository;
import com.sms.storefront.repository.StorefrontCustomerRepository;
import com.sms.storefront.repository.StorefrontPushNotificationLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StorefrontPushNotificationService {

    private final CustomerDeviceTokenRepository tokenRepository;
    private final StorefrontPushNotificationLogRepository notificationLogRepository;
    private final StorefrontCustomerRepository customerRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public CustomerDeviceToken registerDeviceToken(DeviceTokenRegisterRequest req) {
        log.info("Registering device token for customer {}: platform={}", req.customerId(), req.platform());

        UUID customerUuid;
        try {
            customerUuid = UUID.fromString(req.customerId());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid customer UUID: " + req.customerId());
        }

        Optional<StorefrontCustomer> customerOpt = customerRepository.findById(customerUuid);
        if (customerOpt.isEmpty()) {
            throw new IllegalArgumentException("Customer not found: " + req.customerId());
        }

        CustomerDeviceToken token = tokenRepository.findByDeviceToken(req.deviceToken())
                .orElseGet(() -> {
                    CustomerDeviceToken t = new CustomerDeviceToken();
                    t.setDeviceToken(req.deviceToken());
                    return t;
                });

        token.setCustomer(customerOpt.get());
        token.setPlatform(req.platform() != null ? req.platform() : "ANDROID");
        token.setDeviceModel(req.deviceModel());
        token.setActive(true);
        token.setLastActiveAt(Instant.now());

        return tokenRepository.save(token);
    }

    @Transactional
    public StorefrontNotificationDto sendMilestoneNotification(
            String orderNumber,
            String milestoneType,
            String customTitle,
            String customBody,
            Map<String, Object> metadata
    ) {
        log.info("Dispatching milestone notification for order {}: type={}", orderNumber, milestoneType);

        // 1. Resolve SalesOrder and Customer
        Optional<SalesOrder> orderOpt = salesOrderRepository.findByNumber(orderNumber);
        StorefrontCustomer customer = null;
        if (orderOpt.isPresent() && orderOpt.get().getCustomer() != null) {
            String phone = orderOpt.get().getCustomer().getPrimaryPhone();
            if (phone != null && !phone.isBlank()) {
                customer = customerRepository.findByPhone(phone).orElse(null);
            }
        }

        // 2. Build Title and Body according to Milestone
        String title = customTitle;
        String body = customBody;

        if (title == null || title.isBlank()) {
            switch (milestoneType) {
                case "DEPOSIT_CONFIRMED":
                    title = "Pembayaran Terkonfirmasi! 🎉";
                    body = "Pembayaran untuk pesanan #" + orderNumber + " telah kami terima. Penyiapan barang segera diproses.";
                    break;
                case "PO_PLACED":
                    title = "Pengadaan Dimulai (PO Pemasok) 📦";
                    body = "Surat Pemesanan (PO) untuk barang indent pesanan #" + orderNumber + " telah resmi diterbitkan ke distributor.";
                    break;
                case "DRIVER_EN_ROUTE":
                    title = "Armada Toko Sedang Menuju Lokasi 🚚";
                    body = "Driver SMS Mart sedang dalam perjalanan mengantarkan pesanan #" + orderNumber + " ke alamat Anda.";
                    break;
                case "STORE_PICKUP_READY":
                    String branch = metadata != null && metadata.containsKey("pickupStoreName")
                            ? (String) metadata.get("pickupStoreName") : "Showroom Utama";
                    title = "Pesanan Siap Diambil di Cabang 🏬";
                    body = "Pesanan #" + orderNumber + " sudah siap diambil di " + branch + ". Tunjukkan nomor pesanan kepada petugas.";
                    break;
                default:
                    title = "Pembaruan Pesanan #" + orderNumber;
                    body = "Status pesanan Anda telah diperbarui.";
            }
        }

        // 3. Serialize metadata to JSON payload
        String payloadJson = "{}";
        try {
            if (metadata != null) {
                payloadJson = objectMapper.writeValueAsString(metadata);
            }
        } catch (Exception e) {
            log.warn("Failed to serialize push payload metadata", e);
        }

        // 4. Save notification log
        StorefrontPushNotificationLog logEntry = new StorefrontPushNotificationLog();
        logEntry.setCustomer(customer);
        logEntry.setOrderNumber(orderNumber);
        logEntry.setMilestoneType(milestoneType);
        logEntry.setTitle(title);
        logEntry.setBody(body);
        logEntry.setPayloadData(payloadJson);
        logEntry.setStatus("SENT");
        logEntry.setRead(false);
        logEntry.setSentAt(Instant.now());

        StorefrontPushNotificationLog saved = notificationLogRepository.save(logEntry);

        // 5. Simulate FCM / APNs broadcast to customer active devices
        if (customer != null && customer.getId() != null) {
            List<CustomerDeviceToken> tokens = tokenRepository.findByCustomerIdAndActiveTrue(customer.getId());
            log.info("Dispatched push notification to {} active device(s) for customer {}", tokens.size(), customer.getId());
            for (CustomerDeviceToken t : tokens) {
                log.info("-> FCM/APNs simulated push sent to token: {} [{}]", t.getDeviceToken(), t.getPlatform());
            }
        }

        return new StorefrontNotificationDto(
                saved.getId(),
                customer != null && customer.getId() != null ? customer.getId().toString() : null,
                saved.getOrderNumber(),
                saved.getMilestoneType(),
                saved.getTitle(),
                saved.getBody(),
                saved.getPayloadData(),
                saved.getStatus(),
                saved.isRead(),
                saved.getSentAt()
        );
    }

    @Transactional(readOnly = true)
    public List<StorefrontNotificationDto> getCustomerNotifications(String customerId) {
        UUID customerUuid;
        try {
            customerUuid = UUID.fromString(customerId);
        } catch (Exception e) {
            return List.of();
        }

        return notificationLogRepository.findByCustomerIdOrderBySentAtDesc(customerUuid).stream()
                .map(n -> new StorefrontNotificationDto(
                        n.getId(),
                        n.getCustomer() != null && n.getCustomer().getId() != null ? n.getCustomer().getId().toString() : customerId,
                        n.getOrderNumber(),
                        n.getMilestoneType(),
                        n.getTitle(),
                        n.getBody(),
                        n.getPayloadData(),
                        n.getStatus(),
                        n.isRead(),
                        n.getSentAt()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StorefrontNotificationDto> getOrderNotifications(String orderNumber) {
        return notificationLogRepository.findByOrderNumberOrderBySentAtDesc(orderNumber).stream()
                .map(n -> new StorefrontNotificationDto(
                        n.getId(),
                        n.getCustomer() != null && n.getCustomer().getId() != null ? n.getCustomer().getId().toString() : null,
                        n.getOrderNumber(),
                        n.getMilestoneType(),
                        n.getTitle(),
                        n.getBody(),
                        n.getPayloadData(),
                        n.getStatus(),
                        n.isRead(),
                        n.getSentAt()
                ))
                .toList();
    }

    @Transactional
    public void markAsRead(String notificationId) {
        notificationLogRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            n.setReadAt(Instant.now());
            notificationLogRepository.save(n);
        });
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String customerId) {
        try {
            UUID customerUuid = UUID.fromString(customerId);
            return notificationLogRepository.countByCustomerIdAndReadFalse(customerUuid);
        } catch (Exception e) {
            return 0;
        }
    }
}
