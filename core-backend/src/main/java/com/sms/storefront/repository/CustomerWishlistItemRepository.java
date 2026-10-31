package com.sms.storefront.repository;

import com.sms.storefront.model.CustomerWishlistItem;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerWishlistItemRepository extends JpaRepository<CustomerWishlistItem, UUID> {

    List<CustomerWishlistItem> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);

    @Query("SELECT w FROM CustomerWishlistItem w WHERE w.customer IS NULL AND w.sessionId = :sessionId ORDER BY w.createdAt DESC")
    List<CustomerWishlistItem> findBySessionIdOrderByCreatedAtDesc(@Param("sessionId") String sessionId);

    @Query("SELECT w FROM CustomerWishlistItem w WHERE (w.customer.id = :customerId OR (w.customer IS NULL AND w.sessionId = :sessionId)) ORDER BY w.createdAt DESC")
    List<CustomerWishlistItem> findByCustomerOrSession(@Param("customerId") UUID customerId, @Param("sessionId") String sessionId);

    Optional<CustomerWishlistItem> findByCustomerIdAndProductId(UUID customerId, UUID productId);

    @Query("SELECT w FROM CustomerWishlistItem w WHERE w.customer IS NULL AND w.sessionId = :sessionId AND w.product.id = :productId")
    Optional<CustomerWishlistItem> findBySessionIdAndProductId(@Param("sessionId") String sessionId, @Param("productId") UUID productId);

    boolean existsByCustomerIdAndProductId(UUID customerId, UUID productId);

    boolean existsBySessionIdAndProductId(String sessionId, UUID productId);

    @Modifying
    @Query("DELETE FROM CustomerWishlistItem w WHERE w.customer.id = :customerId AND w.product.id = :productId")
    void deleteByCustomerIdAndProductId(@Param("customerId") UUID customerId, @Param("productId") UUID productId);

    @Modifying
    @Query("DELETE FROM CustomerWishlistItem w WHERE w.customer IS NULL AND w.sessionId = :sessionId AND w.product.id = :productId")
    void deleteBySessionIdAndProductId(@Param("sessionId") String sessionId, @Param("productId") UUID productId);

    long countByCustomerId(UUID customerId);

    long countBySessionId(String sessionId);
}
