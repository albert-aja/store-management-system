package com.sms.survey;

import java.math.BigDecimal;

public record AssessmentRequest(
        BigDecimal monthlyIncome,
        BigDecimal monthlyExpenses,
        String existingObligations,
        String residenceNotes,
        String employmentNotes,
        String referencesNotes,
        String abilityToPayAssessment,
        BigDecimal destinationLatitude,
        BigDecimal destinationLongitude,
        BigDecimal alleyWidthMeters,
        BigDecimal stairClearanceMeters,
        String gateAccessNotes) {
}
