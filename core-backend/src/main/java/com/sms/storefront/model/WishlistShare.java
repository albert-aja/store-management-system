package com.sms.storefront.model;

import com.sms.common.audit.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Immutable snapshot of a wishlist shared through a secret public token (only its SHA-256 hash is stored). */
@Entity
@Table(name = "wishlist_share")
@Getter
@Setter
@NoArgsConstructor
public class WishlistShare extends BaseEntity {

    @Column(name = "owner_customer_id")
    private UUID ownerCustomerId;

    @Column(name = "owner_session_id", length = 100)
    private String ownerSessionId;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @OneToMany(mappedBy = "share", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<WishlistShareItem> items = new ArrayList<>();

    @Version
    private long version;

    /** Active strictly before expiry: {@code now >= expiresAt} is expired. */
    public boolean isActiveAt(Instant now) {
        return revokedAt == null && now.isBefore(expiresAt);
    }

    public void addItem(WishlistShareItem item) {
        item.setShare(this);
        item.setSortOrder(items.size());
        items.add(item);
    }
}
