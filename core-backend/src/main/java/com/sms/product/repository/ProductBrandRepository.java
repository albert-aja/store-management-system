package com.sms.product.repository;

import com.sms.product.dto.ProductBrand;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductBrandRepository extends JpaRepository<ProductBrand, UUID> {
}
