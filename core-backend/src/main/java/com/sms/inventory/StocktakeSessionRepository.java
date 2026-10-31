package com.sms.inventory;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StocktakeSessionRepository extends JpaRepository<StocktakeSession, UUID> {

    List<StocktakeSession> findByStoreIdOrderByCreatedAtDesc(UUID storeId);
}
