package com.sms.repossession;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockReturnDispositionRepository extends JpaRepository<StockReturnDisposition, UUID> {

    Optional<StockReturnDisposition> findByStockReturnId(UUID stockReturnId);
}
