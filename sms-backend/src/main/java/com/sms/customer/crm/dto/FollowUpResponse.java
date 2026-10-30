package com.sms.customer.crm.dto;

import com.sms.customer.crm.CustomerFollowUp;
import com.sms.customer.crm.FollowUpStatus;
import com.sms.customer.crm.FollowUpType;
import java.time.Instant;
import java.util.UUID;

public record FollowUpResponse(
        UUID id,
        UUID customerId,
        String customerName,
        String title,
        FollowUpType followUpType,
        Instant scheduledAt,
        String assignedEmployeeName,
        FollowUpStatus status,
        String notes,
        Instant completedAt,
        Instant createdAt
) {
    public static FollowUpResponse from(CustomerFollowUp f) {
        String emp = f.getAssignedEmployee() != null ? f.getAssignedEmployee().getFullName() : "Unassigned";
        return new FollowUpResponse(
                f.getId(),
                f.getCustomer().getId(),
                f.getCustomer().getFullName(),
                f.getTitle(),
                f.getFollowUpType(),
                f.getScheduledAt(),
                emp,
                f.getStatus(),
                f.getNotes(),
                f.getCompletedAt(),
                f.getCreatedAt()
        );
    }
}

