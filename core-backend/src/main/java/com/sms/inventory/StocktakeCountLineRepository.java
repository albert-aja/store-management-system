package com.sms.inventory;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StocktakeCountLineRepository extends JpaRepository<StocktakeCountLine, UUID> {

    List<StocktakeCountLine> findBySessionIdOrderByCreatedAtAsc(UUID sessionId);
}
