package com.sms.inventory;

import com.sms.common.audit.BaseEntity;
import com.sms.foundation.store.Store;
import com.sms.product.dto.ProductVariant;
import com.sms.sales.SalesOrderItem;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Permanent physical item, created only after receiving acceptance (README 6.4); never deleted. */
@Entity
@Table(name = "stock_unit")
@Getter
@Setter
@NoArgsConstructor
public class StockUnit extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_variant_id")
    private ProductVariant productVariant;

    @Column(name = "manufacturer_serial", unique = true, length = 100)
    private String manufacturerSerial;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "current_store_id")
    private Store currentStore;

    @Enumerated(EnumType.STRING)
    @Column(name = "location_type", nullable = false, length = 30)
    private StockLocationType locationType = StockLocationType.WAREHOUSE;

    @Enumerated(EnumType.STRING)
    @Column(name = "availability_status", nullable = false, length = 20)
    private StockAvailability availabilityStatus = StockAvailability.AVAILABLE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reserved_for_so_item_id")
    private SalesOrderItem reservedForSoItem;

    @Column(length = 300)
    private String notes;
}
