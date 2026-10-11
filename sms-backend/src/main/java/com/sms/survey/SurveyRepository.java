package com.sms.survey;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SurveyRepository extends JpaRepository<Survey, UUID> {

    Optional<Survey> findBySalesOrderId(UUID salesOrderId);

    boolean existsBySalesOrderId(UUID salesOrderId);
}
