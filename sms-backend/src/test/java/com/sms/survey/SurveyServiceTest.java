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
}
