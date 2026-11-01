package com.sms.storefront.repository;

import com.sms.storefront.model.ProductReview;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductReviewRepository extends JpaRepository<ProductReview, UUID> {

    List<ProductReview> findByProductIdOrderByCreatedAtDesc(UUID productId);

    Optional<ProductReview> findByCustomerIdAndProductId(UUID customerId, UUID productId);

    boolean existsByCustomerIdAndProductId(UUID customerId, UUID productId);

    @Query(value = """
        SELECT count(pr.id) > 0
        FROM product_review pr
        WHERE pr.customer_id = :customerId AND pr.product_id = :productId
    """, nativeQuery = true)
    boolean hasReviewed(@Param("customerId") UUID customerId, @Param("productId") UUID productId);
}

