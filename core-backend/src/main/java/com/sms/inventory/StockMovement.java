package com.sms.inventory;

import com.sms.common.audit.BaseEntity;
import com.sms.foundation.store.Store;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Immutable ledger row; never updated or deleted once posted (README 6.5). */
@Entity
@Table(name = "stock_movement")
@Getter
@Setter
@NoArgsConstructor
public class StockMovement extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 30)
    private MovementType movementType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_unit_id")
    private StockUnit stockUnit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "component_stock_id")
    private ComponentStock componentStock;

    @Column(nullable = false)
    private int quantity = 1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_store_id")
    private Store fromStore;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_store_id")
    private Store toStore;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_location_type", length = 30)
    private StockLocationType fromLocationType;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_location_type", length = 30)
    private StockLocationType toLocationType;

    @Column(name = "reference_type", length = 60)
    private String referenceType;

    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(length = 300)
    private String notes;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt = Instant.now();
}
