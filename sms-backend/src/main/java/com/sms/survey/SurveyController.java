package com.sms.survey;

import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sales-orders/{salesOrderId}/survey")
@RequiredArgsConstructor
public class SurveyController {

    private final SurveyService surveyService;

    @GetMapping
    public SurveyResponse get(@PathVariable UUID salesOrderId) {
        return SurveyResponse.from(surveyService.getBySalesOrder(salesOrderId));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('SURVEY_MANAGE')")
    public SurveyResponse create(@PathVariable UUID salesOrderId) {
        return SurveyResponse.from(surveyService.createForSalesOrder(salesOrderId));
    }

    @PostMapping("/assign/{surveyorEmployeeId}")
    @PreAuthorize("hasAuthority('SURVEY_MANAGE')")
    public SurveyResponse assignSurveyor(@PathVariable UUID salesOrderId, @PathVariable UUID surveyorEmployeeId) {
        Survey survey = surveyService.getBySalesOrder(salesOrderId);
        return SurveyResponse.from(surveyService.assignSurveyor(survey.getId(), surveyorEmployeeId));
    }

    @PutMapping("/assessment")
    @PreAuthorize("hasAuthority('SURVEY_MANAGE')")
    public SurveyResponse updateAssessment(@PathVariable UUID salesOrderId, @Valid @RequestBody AssessmentRequest request) {
        Survey survey = surveyService.getBySalesOrder(salesOrderId);
        return SurveyResponse.from(surveyService.updateAssessment(survey.getId(), request));
    }

    @PostMapping("/decide")
    @PreAuthorize("hasAuthority('SURVEY_DECIDE')")
    public SurveyResponse decide(@PathVariable UUID salesOrderId, @Valid @RequestBody DecideSurveyRequest request) {
        Survey survey = surveyService.getBySalesOrder(salesOrderId);
        return SurveyResponse.from(surveyService.decide(survey.getId(), request.approve(), request.notes()));
    }
}
