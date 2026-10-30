package com.sms.survey;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.sms.common.web.BusinessRuleException;
import com.sms.foundation.employee.Employee;
import com.sms.foundation.employee.EmployeeRepository;
import com.sms.sales.SalesOrder;
import com.sms.sales.SalesOrderItemRepository;
import com.sms.sales.SalesOrderRepository;
import com.sms.sales.SalesOrderStatus;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SurveyServiceTest {

    @Mock
    private SurveyRepository surveyRepository;
    @Mock
    private SalesOrderRepository salesOrderRepository;
    @Mock
    private SalesOrderItemRepository itemRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private com.sms.inventory.ReservationService reservationService;

    @InjectMocks
    private SurveyService surveyService;

    @Test
    void decide_rejectedResultTerminatesTheSalesOrder() {
        UUID surveyId = UUID.randomUUID();
        SalesOrder salesOrder = new SalesOrder();
        salesOrder.setStatus(SalesOrderStatus.RELEASED);

        Survey survey = new Survey();
        survey.setSalesOrder(salesOrder);
        survey.setSurveyor(new Employee());
        when(surveyRepository.findById(surveyId)).thenReturn(Optional.of(survey));

        surveyService.decide(surveyId, false, "Unable to verify income");

        assertThat(survey.getStatus()).isEqualTo(SurveyStatus.REJECTED);
        assertThat(salesOrder.getStatus()).isEqualTo(SalesOrderStatus.SURVEY_REJECTED);
    }

    @Test
    void decide_throwsWhenNoSurveyorAssigned() {
        UUID surveyId = UUID.randomUUID();
        Survey survey = new Survey();
        survey.setSalesOrder(new SalesOrder());
        when(surveyRepository.findById(surveyId)).thenReturn(Optional.of(survey));

        assertThatThrownBy(() -> surveyService.decide(surveyId, true, null))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void updateAssessment_savesStructuredLocationFields() {
        UUID surveyId = UUID.randomUUID();
        Survey survey = new Survey();
        survey.setStatus(SurveyStatus.PENDING);
        when(surveyRepository.findById(surveyId)).thenReturn(Optional.of(survey));

        AssessmentRequest req = new AssessmentRequest(
                BigDecimal.valueOf(5000000),
                BigDecimal.valueOf(2000000),
                "None",
                "Residential house",
                "Permanent staff",
                "Neighbors confirmed",
                "High capacity",
                BigDecimal.valueOf(-6.2088),
                BigDecimal.valueOf(106.8456),
                BigDecimal.valueOf(3.5),
                BigDecimal.valueOf(1.8),
                "Narrow entrance gate with ramp"
        );

        Survey updated = surveyService.updateAssessment(surveyId, req);

        assertThat(updated.getDestinationLatitude()).isEqualTo(BigDecimal.valueOf(-6.2088));
        assertThat(updated.getDestinationLongitude()).isEqualTo(BigDecimal.valueOf(106.8456));
        assertThat(updated.getAlleyWidthMeters()).isEqualTo(BigDecimal.valueOf(3.5));
        assertThat(updated.getStairClearanceMeters()).isEqualTo(BigDecimal.valueOf(1.8));
        assertThat(updated.getGateAccessNotes()).isEqualTo("Narrow entrance gate with ramp");
    }
}
