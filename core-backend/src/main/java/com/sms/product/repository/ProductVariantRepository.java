package com.sms.product.repository;

import java.util.List;
import java.util.UUID;

import com.sms.product.dto.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, UUID> {

    List<ProductVariant> findByProductIdOrderByVariantName(UUID productId);

    boolean existsBySku(String sku);
}
