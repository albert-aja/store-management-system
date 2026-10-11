package com.sms.product.repository;

import java.util.List;
import java.util.UUID;

import com.sms.product.dto.ProductComponent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductComponentRepository extends JpaRepository<ProductComponent, UUID> {

    List<ProductComponent> findByProductIdOrderByName(UUID productId);
}
