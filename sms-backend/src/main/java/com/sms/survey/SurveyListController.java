package com.sms.survey;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/surveys")
@RequiredArgsConstructor
public class SurveyListController {

    private final SurveyService surveyService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('SURVEY_MANAGE', 'SURVEY_DECIDE')")
    public List<SurveyResponse> listSurveys(
            @RequestParam(required = false) UUID surveyorId,
            @RequestParam(required = false) SurveyStatus status) {
        return surveyService.searchSurveys(surveyorId, status).stream()
                .map(SurveyResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('SURVEY_MANAGE', 'SURVEY_DECIDE')")
    public SurveyResponse getSurvey(@PathVariable UUID id) {
        return SurveyResponse.from(surveyService.getSurvey(id));
    }

    @PutMapping("/{id}/assessment")
    @PreAuthorize("hasAnyAuthority('SURVEY_MANAGE', 'SURVEY_DECIDE')")
    public SurveyResponse updateAssessment(
            @PathVariable UUID id,
            @Valid @RequestBody AssessmentRequest request) {
        return SurveyResponse.from(surveyService.updateAssessment(id, request));
    }

    @PostMapping("/{id}/decide")
    @PreAuthorize("hasAuthority('SURVEY_DECIDE')")
    public SurveyResponse decide(
            @PathVariable UUID id,
            @Valid @RequestBody DecideSurveyRequest request) {
        return SurveyResponse.from(surveyService.decide(id, request.approve(), request.notes()));
    }
}

