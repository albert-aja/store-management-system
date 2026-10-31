package com.sms.delivery;

import com.sms.common.audit.BaseEntity;
import com.sms.storefront.model.StorefrontCustomer;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "delivery_reschedule_request")
@Getter
@Setter
@NoArgsConstructor
public class DeliveryRescheduleRequest extends BaseEntity {
    public enum Status { PENDING, APPROVED, REJECTED }

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "delivery_order_id", nullable = false)
    private DeliveryOrder deliveryOrder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requester_id", nullable = false)
    private StorefrontCustomer requester;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "original_trip_id", nullable = false)
    private DeliveryTrip originalTrip;

    @Column(nullable = false)
    private Instant originalDispatchAt;

    @Column(nullable = false)
    private LocalDate requestedDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DeliveryWindow requestedWindow;

    @Column(length = 300)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.PENDING;

    private Instant decidedAt;
    private UUID decidedBy;

    @Column(length = 300)
    private String decisionNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_trip_id")
    private DeliveryTrip assignedTrip;

    @Version
    private long version;
}
