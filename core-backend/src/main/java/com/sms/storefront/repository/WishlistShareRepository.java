package com.sms.storefront.repository;

import com.sms.storefront.model.WishlistShare;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface WishlistShareRepository extends JpaRepository<WishlistShare, UUID> {

    Optional<WishlistShare> findByTokenHash(String tokenHash);

    List<WishlistShare> findByOwnerCustomerIdOrderByCreatedAtDesc(UUID ownerCustomerId);

    @Query("SELECT s FROM WishlistShare s WHERE s.ownerCustomerId IS NULL AND s.ownerSessionId = :sessionId ORDER BY s.createdAt DESC")
    List<WishlistShare> findGuestShares(@Param("sessionId") String sessionId);

    Optional<WishlistShare> findByIdAndOwnerCustomerId(UUID id, UUID ownerCustomerId);

    @Query("SELECT s FROM WishlistShare s WHERE s.id = :id AND s.ownerCustomerId IS NULL AND s.ownerSessionId = :sessionId")
    Optional<WishlistShare> findGuestShare(@Param("id") UUID id, @Param("sessionId") String sessionId);
}
