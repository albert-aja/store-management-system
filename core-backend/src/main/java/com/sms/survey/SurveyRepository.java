package com.sms.survey;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SurveyRepository extends JpaRepository<Survey, UUID> {

    Optional<Survey> findBySalesOrderId(UUID salesOrderId);

    boolean existsBySalesOrderId(UUID salesOrderId);

    List<Survey> findBySurveyorIdAndStatus(UUID surveyorId, SurveyStatus status);

    List<Survey> findBySurveyorId(UUID surveyorId);

    List<Survey> findByStatus(SurveyStatus status);
}
