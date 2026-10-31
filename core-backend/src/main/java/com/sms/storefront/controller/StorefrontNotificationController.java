package com.sms.storefront.controller;

import com.sms.storefront.dto.DeviceTokenRegisterRequest;
import com.sms.storefront.dto.StorefrontNotificationDto;
import com.sms.storefront.dto.TriggerMilestoneRequest;
import com.sms.storefront.service.StorefrontPushNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/storefront/notifications")
@RequiredArgsConstructor
public class StorefrontNotificationController {

    private final StorefrontPushNotificationService pushNotificationService;

    @PostMapping("/device-token")
    public ResponseEntity<Map<String, Object>> registerDeviceToken(@RequestBody DeviceTokenRegisterRequest req) {
        pushNotificationService.registerDeviceToken(req);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Device token registered successfully"));
    }

    @GetMapping
    public ResponseEntity<List<StorefrontNotificationDto>> getNotifications(
            @RequestParam(required = false) String customerId,
            @RequestParam(required = false) String orderNumber
    ) {
        if (orderNumber != null && !orderNumber.isBlank()) {
            return ResponseEntity.ok(pushNotificationService.getOrderNotifications(orderNumber));
        }
        if (customerId != null && !customerId.isBlank()) {
            return ResponseEntity.ok(pushNotificationService.getCustomerNotifications(customerId));
        }
        return ResponseEntity.badRequest().build();
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(@RequestParam String customerId) {
        long count = pushNotificationService.getUnreadCount(customerId);
        return ResponseEntity.ok(Map.of("customerId", customerId, "unreadCount", count));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(@PathVariable String id) {
        pushNotificationService.markAsRead(id);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "notificationId", id));
    }

    @PostMapping("/trigger-milestone")
    public ResponseEntity<StorefrontNotificationDto> triggerMilestone(@RequestBody TriggerMilestoneRequest req) {
        StorefrontNotificationDto dto = pushNotificationService.sendMilestoneNotification(
                req.orderNumber(),
                req.milestoneType(),
                req.customTitle(),
                req.customBody(),
                req.metadata()
        );
        return ResponseEntity.ok(dto);
    }
}

