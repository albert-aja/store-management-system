package com.sms.storefront;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sms.customer.Customer;
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
import com.sms.storefront.service.StorefrontPushNotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@ExtendWith(MockitoExtension.class)
class StorefrontPushNotificationServiceTest {

    @Mock private CustomerDeviceTokenRepository tokenRepository;
    @Mock private StorefrontPushNotificationLogRepository notificationLogRepository;
    @Mock private StorefrontCustomerRepository customerRepository;
    @Mock private SalesOrderRepository salesOrderRepository;

    private StorefrontPushNotificationService notificationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private StorefrontCustomer testCustomer;
    private SalesOrder testOrder;
    private UUID customerId;

    @BeforeEach
    void setUp() {
        notificationService = new StorefrontPushNotificationService(
                tokenRepository, notificationLogRepository, customerRepository, salesOrderRepository, objectMapper
        );

        customerId = UUID.randomUUID();
        testCustomer = new StorefrontCustomer();
        ReflectionTestUtils.setField(testCustomer, "id", customerId);
        testCustomer.setPhone("081234567890");
        testCustomer.setFullName("Budi Santoso");

        testOrder = new SalesOrder();
        testOrder.setNumber("SO-APP-888999");
        Customer baseCustomer = new Customer();
        baseCustomer.setPrimaryPhone("081234567890");
        testOrder.setCustomer(baseCustomer);
    }

    @Test
    void testRegisterDeviceToken() {
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(testCustomer));
        when(tokenRepository.findByDeviceToken("fcm-tok-xyz")).thenReturn(Optional.empty());
        when(tokenRepository.save(any(CustomerDeviceToken.class))).thenAnswer(i -> i.getArgument(0));

        DeviceTokenRegisterRequest req = new DeviceTokenRegisterRequest(customerId.toString(), "fcm-tok-xyz", "ANDROID", "Pixel 8");
        CustomerDeviceToken token = notificationService.registerDeviceToken(req);

        assertThat(token.getDeviceToken()).isEqualTo("fcm-tok-xyz");
        assertThat(token.getPlatform()).isEqualTo("ANDROID");
        assertThat(token.isActive()).isTrue();
        verify(tokenRepository).save(any(CustomerDeviceToken.class));
    }

    @Test
    void testSendDepositConfirmedMilestone() {
        when(salesOrderRepository.findByNumber("SO-APP-888999")).thenReturn(Optional.of(testOrder));
        when(customerRepository.findByPhone("081234567890")).thenReturn(Optional.of(testCustomer));
        when(notificationLogRepository.save(any(StorefrontPushNotificationLog.class))).thenAnswer(i -> {
            StorefrontPushNotificationLog log = i.getArgument(0);
            log.setId("notif-1");
            return log;
        });

        StorefrontNotificationDto dto = notificationService.sendMilestoneNotification(
                "SO-APP-888999",
                "DEPOSIT_CONFIRMED",
                null,
                null,
                Map.of("amount", 1500000)
        );

        assertThat(dto).isNotNull();
        assertThat(dto.milestoneType()).isEqualTo("DEPOSIT_CONFIRMED");
        assertThat(dto.title()).contains("Pembayaran Terkonfirmasi");
        assertThat(dto.orderNumber()).isEqualTo("SO-APP-888999");

        ArgumentCaptor<StorefrontPushNotificationLog> captor = ArgumentCaptor.forClass(StorefrontPushNotificationLog.class);
        verify(notificationLogRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo("SENT");
    }

    @Test
    void testSendDriverEnRouteAndPickupReadyMilestones() {
        when(salesOrderRepository.findByNumber("SO-APP-888999")).thenReturn(Optional.of(testOrder));
        when(customerRepository.findByPhone("081234567890")).thenReturn(Optional.of(testCustomer));
        when(notificationLogRepository.save(any(StorefrontPushNotificationLog.class))).thenAnswer(i -> {
            StorefrontPushNotificationLog log = i.getArgument(0);
            log.setId("notif-2");
            return log;
        });

        StorefrontNotificationDto driverDto = notificationService.sendMilestoneNotification(
                "SO-APP-888999", "DRIVER_EN_ROUTE", null, null, Map.of("driverName", "Joko")
        );
        assertThat(driverDto.title()).contains("Armada Toko");

        StorefrontNotificationDto pickupDto = notificationService.sendMilestoneNotification(
                "SO-APP-888999", "STORE_PICKUP_READY", null, null, Map.of("pickupStoreName", "SMS Cabang Kelapa Gading")
        );
        assertThat(pickupDto.title()).contains("Pesanan Siap Diambil");
        assertThat(pickupDto.body()).contains("SMS Cabang Kelapa Gading");
    }

    @Test
    void testMarkAsRead() {
        StorefrontPushNotificationLog logEntry = new StorefrontPushNotificationLog();
        logEntry.setId("notif-100");
        logEntry.setRead(false);

        when(notificationLogRepository.findById("notif-100")).thenReturn(Optional.of(logEntry));

        notificationService.markAsRead("notif-100");

        assertThat(logEntry.isRead()).isTrue();
        assertThat(logEntry.getReadAt()).isNotNull();
        verify(notificationLogRepository).save(logEntry);
    }
}
