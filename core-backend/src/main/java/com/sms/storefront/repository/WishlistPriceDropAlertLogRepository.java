package com.sms.storefront.repository;

import com.sms.storefront.model.WishlistPriceDropAlertLog;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WishlistPriceDropAlertLogRepository extends JpaRepository<WishlistPriceDropAlertLog, UUID> {
    List<WishlistPriceDropAlertLog> findByCustomerIdOrderByDispatchedAtDesc(UUID customerId);
    List<WishlistPriceDropAlertLog> findByWishlistItemIdOrderByDispatchedAtDesc(UUID wishlistItemId);
}

