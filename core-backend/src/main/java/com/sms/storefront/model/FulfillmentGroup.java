package com.sms.storefront.model;

import com.sms.common.audit.BaseEntity;
import com.sms.foundation.store.Store;
import com.sms.sales.SalesOrder;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "fulfillment_group")
@Getter
@Setter
@NoArgsConstructor
public class FulfillmentGroup extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sales_order_id")
    private SalesOrder salesOrder;

    @Column(name = "group_number", nullable = false)
    private int groupNumber = 1;

    @Column(name = "fulfillment_method", length = 30, nullable = false)
    private String fulfillmentMethod = "DELIVERY"; // DELIVERY or PICKUP

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pickup_store_id")
    private Store pickupStore;

    @Column(nullable = false, length = 40)
    private String status = "PENDING"; // PENDING, AWAITING_PROCUREMENT, AWAITING_STAGING, READY_FOR_PACKING, PACKED, DISPATCHED, READY_FOR_PICKUP, COMPLETED, CANCELLED

    @Column(name = "tracking_number", length = 60)
    private String trackingNumber;

    @Column(name = "estimated_delivery_date")
    private Instant estimatedDeliveryDate;

    @Column(name = "staging_rack_location", length = 100)
    private String stagingRackLocation;

    @Column(name = "pickup_pass_code", length = 50)
    private String pickupPassCode;

    @Column(name = "pickup_qr_payload", columnDefinition = "TEXT")
    private String pickupQrPayload;

    @Column(name = "staged_at")
    private Instant stagedAt;

    @Column(name = "staged_by_staff_name", length = 150)
    private String stagedByStaffName;

    @Column(name = "handed_over_at")
    private Instant handedOverAt;

    @Column(name = "handed_over_by_staff_name", length = 150)
    private String handedOverByStaffName;

    @Column(name = "handover_recipient_name", length = 150)
    private String handoverRecipientName;

    @Column(name = "handover_recipient_phone", length = 50)
    private String handoverRecipientPhone;

    @Column(name = "handover_notes", columnDefinition = "TEXT")
    private String handoverNotes;

    @Column(length = 500)
    private String notes;
}
