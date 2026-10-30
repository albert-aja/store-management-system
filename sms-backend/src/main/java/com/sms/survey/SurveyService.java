package com.sms.survey;

import com.sms.common.web.BusinessRuleException;
import com.sms.common.web.ConflictException;
import com.sms.common.web.NotFoundException;
import com.sms.foundation.employee.Employee;
import com.sms.foundation.employee.EmployeeRepository;
import com.sms.sales.SalesOrder;
import com.sms.sales.SalesOrderItemRepository;
import com.sms.sales.SalesOrderRepository;
import com.sms.sales.SalesOrderStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class SurveyService {

    private final SurveyRepository surveyRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final SalesOrderItemRepository itemRepository;
    private final EmployeeRepository employeeRepository;
    private final com.sms.inventory.ReservationService reservationService;

    @Transactional(readOnly = true)
    public Survey getBySalesOrder(UUID salesOrderId) {
        return surveyRepository.findBySalesOrderId(salesOrderId)
                .orElseThrow(() -> new NotFoundException("No survey for Sales Order: " + salesOrderId));
    }

    @Transactional(readOnly = true)
    public Survey getSurvey(UUID surveyId) {
        return surveyRepository.findById(surveyId)
                .orElseThrow(() -> new NotFoundException("Survey not found: " + surveyId));
    }

    @Transactional(readOnly = true)
    public List<Survey> searchSurveys(UUID surveyorId, SurveyStatus status) {
        if (surveyorId != null && status != null) {
            return surveyRepository.findBySurveyorIdAndStatus(surveyorId, status);
        } else if (surveyorId != null) {
            return surveyRepository.findBySurveyorId(surveyorId);
        } else if (status != null) {
            return surveyRepository.findByStatus(status);
        }
        return surveyRepository.findAll();
    }

    /** Only credit SOs (any item with a non-cash term) require a survey; cash-only SOs skip straight to confirmation. */
    public Survey createForSalesOrder(UUID salesOrderId) {
        SalesOrder salesOrder = salesOrderRepository.findById(salesOrderId)
                .orElseThrow(() -> new NotFoundException("Sales Order not found: " + salesOrderId));
        if (salesOrder.getStatus() != SalesOrderStatus.RELEASED) {
            throw new BusinessRuleException("Sales Order must be Released before a survey can start");
        }
        boolean isCredit = itemRepository.findBySalesOrderId(salesOrderId).stream()
                .anyMatch(i -> i.getPaymentTermMonths() > 0);
        if (!isCredit) {
            throw new BusinessRuleException("Cash-only Sales Order does not require a survey");
        }
        if (surveyRepository.existsBySalesOrderId(salesOrderId)) {
            throw new ConflictException("Survey already exists for this Sales Order");
        }
        Survey survey = new Survey();
        survey.setSalesOrder(salesOrder);
        return surveyRepository.save(survey);
    }

    public Survey assignSurveyor(UUID surveyId, UUID surveyorEmployeeId) {
        Survey survey = requirePending(surveyId);
        Employee surveyor = employeeRepository.findById(surveyorEmployeeId)
                .orElseThrow(() -> new NotFoundException("Employee not found: " + surveyorEmployeeId));
        survey.setSurveyor(surveyor);
        return survey;
    }

    public Survey updateAssessment(UUID surveyId, AssessmentRequest request) {
        Survey survey = requirePending(surveyId);
        survey.setMonthlyIncome(request.monthlyIncome());
        survey.setMonthlyExpenses(request.monthlyExpenses());
        survey.setExistingObligations(request.existingObligations());
        survey.setResidenceNotes(request.residenceNotes());
        survey.setEmploymentNotes(request.employmentNotes());
        survey.setReferencesNotes(request.referencesNotes());
        survey.setAbilityToPayAssessment(request.abilityToPayAssessment());
        return survey;
    }

    /** The surveyor's Approved/Rejected result is decisive (README 9.2); Rejected permanently terminates the SO. */
    public Survey decide(UUID surveyId, boolean approve, String notes) {
        Survey survey = requirePending(surveyId);
        if (survey.getSurveyor() == null) {
            throw new BusinessRuleException("Survey has no assigned surveyor yet");
        }
        survey.setStatus(approve ? SurveyStatus.APPROVED : SurveyStatus.REJECTED);
        survey.setDecidedAt(Instant.now());
        survey.setDecisionNotes(notes);
        if (!approve) {
            survey.getSalesOrder().setStatus(SalesOrderStatus.SURVEY_REJECTED);
            reservationService.releaseForSalesOrder(survey.getSalesOrder().getId());
        }
        return survey;
    }

    private Survey requirePending(UUID surveyId) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new NotFoundException("Survey not found: " + surveyId));
        if (survey.getStatus() != SurveyStatus.PENDING) {
            throw new BusinessRuleException("Survey is no longer pending: " + survey.getStatus());
        }
        return survey;
    }
}
