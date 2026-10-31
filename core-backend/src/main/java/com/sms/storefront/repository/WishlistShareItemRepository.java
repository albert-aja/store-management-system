package com.sms.storefront.repository;

import com.sms.storefront.model.WishlistShareItem;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface WishlistShareItemRepository extends JpaRepository<WishlistShareItem, UUID> {

    boolean existsByIdAndShareId(UUID id, UUID shareId);

    /** Atomic compare-and-set: only one concurrent claimant can move an item from unreserved to reserved. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE WishlistShareItem i
               SET i.reservationKeyHash = :keyHash, i.reservedAt = :now, i.updatedAt = :now, i.version = i.version + 1
             WHERE i.id = :itemId AND i.share.id = :shareId AND i.reservationKeyHash IS NULL
            """)
    int claim(@Param("shareId") UUID shareId, @Param("itemId") UUID itemId,
              @Param("keyHash") String keyHash, @Param("now") Instant now);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE WishlistShareItem i
               SET i.reservationKeyHash = NULL, i.reservedAt = NULL, i.updatedAt = :now, i.version = i.version + 1
             WHERE i.id = :itemId AND i.share.id = :shareId AND i.reservationKeyHash = :keyHash
            """)
    int release(@Param("shareId") UUID shareId, @Param("itemId") UUID itemId,
                @Param("keyHash") String keyHash, @Param("now") Instant now);
}
