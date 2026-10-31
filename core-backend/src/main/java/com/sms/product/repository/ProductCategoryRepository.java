package com.sms.product.repository;

import com.sms.product.dto.ProductCategory;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductCategoryRepository extends JpaRepository<ProductCategory, UUID> {
}
