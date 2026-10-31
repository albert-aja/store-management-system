package com.sms.delivery;

import com.sms.common.audit.BaseEntity;
import com.sms.sales.SalesOrder;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Outbound delivery document (Surat Jalan / Delivery Note).
 * 1 SalesOrder -> many Deliveries (batches / partial delivery supported, README 11.2).
 */
@Entity
@Table(name = "delivery_order")
@Getter
@Setter
@NoArgsConstructor
public class DeliveryOrder extends BaseEntity {

    @Column(name = "delivery_order_number", unique = true, length = 60)
    private String deliveryOrderNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sales_order_id")
    private SalesOrder salesOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_trip_id")
    private DeliveryTrip deliveryTrip;

    @Column(name = "destination_address", nullable = false, length = 300)
    private String destinationAddress;

    @Column(name = "destination_latitude")
    private Double destinationLatitude;

    @Column(name = "destination_longitude")
    private Double destinationLongitude;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_window", length = 20)
    private DeliveryWindow deliveryWindow;

    @Version
    private long version;

    @Column(name = "recipient_name", length = 100)
    private String recipientName;

    @Column(name = "recipient_phone", length = 50)
    private String recipientPhone;

    @Column(name = "stop_sequence", nullable = false)
    private int stopSequence = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DeliveryOrderStatus status = DeliveryOrderStatus.PENDING;

    @Column(name = "pre_inspection_passed", nullable = false)
    private boolean preInspectionPassed = false;

    @Column(name = "pre_inspection_notes", length = 300)
    private String preInspectionNotes;

    @Column(name = "delivered_at")
    private Instant deliveredAt;

    @Column(name = "signed_by", length = 100)
    private String signedBy;

    @Column(name = "proof_photo_url", length = 500)
    private String proofPhotoUrl;

    @Column(name = "failure_reason", length = 300)
    private String failureReason;

    @Column(name = "cod_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal codAmount = BigDecimal.ZERO;

    @Column(name = "cod_collected", nullable = false, precision = 14, scale = 2)
    private BigDecimal codCollected = BigDecimal.ZERO;

    @Column(name = "cod_notes", length = 300)
    private String codNotes;

    @Column(length = 300)
    private String notes;

    @OneToMany(mappedBy = "deliveryOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DeliveryItem> items = new ArrayList<>();
}
