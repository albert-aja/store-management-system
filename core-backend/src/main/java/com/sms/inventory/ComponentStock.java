package com.sms.inventory;

import com.sms.common.audit.BaseEntity;
import com.sms.foundation.store.Store;
import com.sms.product.dto.ProductComponent;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Loose spare-part quantity (README 6.2); deferred here from the Product module since it's ledger-backed. */
@Entity
@Table(name = "component_stock", uniqueConstraints = @UniqueConstraint(columnNames = {"store_id", "product_component_id"}))
@Getter
@Setter
@NoArgsConstructor
public class ComponentStock extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_id")
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_component_id")
    private ProductComponent productComponent;

    @Column(name = "quantity_on_hand", nullable = false)
    private int quantityOnHand = 0;

    @Column(length = 300)
    private String notes;
}
