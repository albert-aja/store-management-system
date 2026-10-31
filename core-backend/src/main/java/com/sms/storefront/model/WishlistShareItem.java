package com.sms.storefront.model;

import com.sms.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One wishlist product in a share snapshot; a reservation claims the whole item (quantity is always 1). */
@Entity
@Table(name = "wishlist_share_item")
@Getter
@Setter
@NoArgsConstructor
public class WishlistShareItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "share_id", nullable = false)
    private WishlistShare share;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "variant_id")
    private UUID variantId;

    @Column(name = "product_name", nullable = false, length = 255)
    private String productName;

    @Column(name = "variant_name", length = 255)
    private String variantName;

    @Column(name = "primary_image_url", length = 1000)
    private String primaryImageUrl;

    @Column(nullable = false)
    private int quantity = 1;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "reservation_key_hash", length = 64)
    private String reservationKeyHash;

    @Column(name = "reserved_at")
    private Instant reservedAt;

    @Version
    private long version;

    public boolean isReserved() {
        return reservationKeyHash != null;
    }
}
