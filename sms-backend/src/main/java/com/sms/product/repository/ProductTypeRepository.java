package com.sms.product.repository;

import com.sms.product.dto.ProductType;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductTypeRepository extends JpaRepository<ProductType, UUID> {
}
