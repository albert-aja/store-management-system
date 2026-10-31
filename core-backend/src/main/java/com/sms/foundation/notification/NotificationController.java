package com.sms.foundation.notification;

import com.sms.common.security.SmsUserPrincipal;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping
    public void create(@Valid @RequestBody CreateNotificationRequest request) {
        notificationService.create(request.referenceType(), request.referenceId(), request.title(),
                request.body(), request.recipientEmployeeIds());
    }

    @GetMapping
    public List<NotificationResponse> list(@RequestParam(defaultValue = "false") boolean unread,
                                            @AuthenticationPrincipal SmsUserPrincipal principal) {
        return notificationService.listForEmployee(principal.employeeId(), unread).stream()
                .map(NotificationResponse::from).toList();
    }

    @PatchMapping("/{recipientId}/read")
    public void markRead(@PathVariable UUID recipientId) {
        notificationService.markRead(recipientId);
    }
}
