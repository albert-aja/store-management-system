package com.sms.survey;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record SurveyResponse(
        UUID id, UUID salesOrderId, UUID surveyorEmployeeId, SurveyStatus status,
        BigDecimal monthlyIncome, BigDecimal monthlyExpenses, String existingObligations,
        String residenceNotes, String employmentNotes, String referencesNotes, String abilityToPayAssessment,
        Instant decidedAt, String decisionNotes) {

    public static SurveyResponse from(Survey s) {
        return new SurveyResponse(s.getId(), s.getSalesOrder().getId(),
                s.getSurveyor() != null ? s.getSurveyor().getId() : null, s.getStatus(),
                s.getMonthlyIncome(), s.getMonthlyExpenses(), s.getExistingObligations(), s.getResidenceNotes(),
                s.getEmploymentNotes(), s.getReferencesNotes(), s.getAbilityToPayAssessment(),
                s.getDecidedAt(), s.getDecisionNotes());
    }
}
