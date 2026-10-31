package com.sms.expense;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sms.common.web.ConflictException;
import com.sms.foundation.employee.Employee;
import com.sms.foundation.employee.EmployeeRepository;
import com.sms.expense.dto.ApproveBudgetRequest;
import com.sms.expense.dto.ApproveExpenseRequest;
import com.sms.expense.dto.BudgetConsumptionResponse;
import com.sms.expense.dto.BudgetRequestResponse;
import com.sms.expense.dto.CreateBudgetRequest;
import com.sms.expense.dto.CreateExpenseCategoryRequest;
import com.sms.expense.dto.CreateExpenseRequest;
import com.sms.expense.dto.ExpenseCategoryResponse;
import com.sms.expense.dto.ExpenseResponse;
import com.sms.foundation.numbering.DocumentNumberingService;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    @Mock
    private ExpenseCategoryRepository categoryRepository;

    @Mock
    private BudgetRequestRepository budgetRequestRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private StoreRepository storeRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private DocumentNumberingService numberingService;

    @InjectMocks
    private ExpenseService expenseService;

    private Store store;
    private Employee manager;
    private ExpenseCategory category;
    private UUID storeId;
    private UUID managerId;
    private UUID categoryId;

    @BeforeEach
    void setUp() {
        storeId = UUID.randomUUID();
        store = new Store();
        ReflectionTestUtils.setField(store, "id", storeId);
        store.setCode("ST01");
        store.setName("Main Store");

        managerId = UUID.randomUUID();
        manager = new Employee();
        ReflectionTestUtils.setField(manager, "id", managerId);
        manager.setFullName("Budi Manager");

        categoryId = UUID.randomUUID();
        category = new ExpenseCategory();
        ReflectionTestUtils.setField(category, "id", categoryId);
        category.setCode("VEHICLE_OPS");
        category.setName("Vehicle Fuel & Maintenance");
        category.setMonthlyLimit(new BigDecimal("5000000"));
        category.setRequiresReceipt(true);
        category.setActive(true);
    }

    private <T> T withId(T entity, UUID id) {
        ReflectionTestUtils.setField(entity, "id", id);
        return entity;
    }

    @Test
    void createCategory_success() {
        CreateExpenseCategoryRequest req = new CreateExpenseCategoryRequest();
        req.setCode("UTILITIES");
        req.setName("Store Utilities");
        req.setMonthlyLimit(new BigDecimal("2000000"));

        when(categoryRepository.findByCode("UTILITIES")).thenReturn(Optional.empty());
        when(categoryRepository.save(any(ExpenseCategory.class))).thenAnswer(inv -> {
            ExpenseCategory c = inv.getArgument(0);
            return withId(c, UUID.randomUUID());
        });

        ExpenseCategoryResponse resp = expenseService.createCategory(req);
        assertThat(resp.getCode()).isEqualTo("UTILITIES");
        assertThat(resp.getName()).isEqualTo("Store Utilities");
    }

    @Test
    void createCategory_duplicateCode_throwsConflict() {
        CreateExpenseCategoryRequest req = new CreateExpenseCategoryRequest();
        req.setCode("VEHICLE_OPS");
        req.setName("Vehicle Operations");

        when(categoryRepository.findByCode("VEHICLE_OPS")).thenReturn(Optional.of(category));

        assertThatThrownBy(() -> expenseService.createCategory(req))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    void createBudgetRequest_and_approveBudgetRequest() {
        CreateBudgetRequest req = new CreateBudgetRequest();
        req.setStoreId(storeId);
        req.setExpenseCategoryId(categoryId);
        req.setPeriodMonth(10);
        req.setPeriodYear(2026);
        req.setRequestedAmount(new BigDecimal("6000000"));
        req.setRequestedById(managerId);
        req.setJustification("Higher delivery volume expected");

        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
        when(employeeRepository.findById(managerId)).thenReturn(Optional.of(manager));
        when(budgetRequestRepository.findByStoreIdAndExpenseCategoryIdAndPeriodMonthAndPeriodYear(
                storeId, categoryId, 10, 2026)).thenReturn(Optional.empty());
        when(numberingService.nextNumber(storeId, "BUDGET_REQUEST")).thenReturn("BDG/ST01/10/2026/0001");
        when(budgetRequestRepository.save(any(BudgetRequest.class))).thenAnswer(inv -> {
            BudgetRequest b = inv.getArgument(0);
            return withId(b, UUID.randomUUID());
        });

        BudgetRequestResponse resp = expenseService.createBudgetRequest(req);
        assertThat(resp.getRequestNumber()).isEqualTo("BDG/ST01/10/2026/0001");
        assertThat(resp.getStatus()).isEqualTo(BudgetRequestStatus.SUBMITTED);
        assertThat(resp.getRequestedAmount()).isEqualByComparingTo("6000000");

        // Now approve
        UUID budgetId = resp.getId();
        BudgetRequest savedBudget = new BudgetRequest();
        ReflectionTestUtils.setField(savedBudget, "id", budgetId);
        savedBudget.setStore(store);
        savedBudget.setExpenseCategory(category);
        savedBudget.setRequestedAmount(new BigDecimal("6000000"));
        savedBudget.setStatus(BudgetRequestStatus.SUBMITTED);

        when(budgetRequestRepository.findById(budgetId)).thenReturn(Optional.of(savedBudget));
        when(budgetRequestRepository.save(any(BudgetRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        ApproveBudgetRequest appReq = new ApproveBudgetRequest();
        appReq.setApprovedById(managerId);
        appReq.setApprovedAmount(new BigDecimal("5500000"));
        appReq.setApproved(true);

        BudgetRequestResponse appResp = expenseService.approveBudgetRequest(budgetId, appReq);
        assertThat(appResp.getStatus()).isEqualTo(BudgetRequestStatus.APPROVED);
        assertThat(appResp.getApprovedAmount()).isEqualByComparingTo("5500000");
    }

    @Test
    void createExpense_withinBudget_approvedDirectly() {
        CreateExpenseRequest req = new CreateExpenseRequest();
        req.setStoreId(storeId);
        req.setExpenseCategoryId(categoryId);
        req.setAmount(new BigDecimal("1500000"));
        req.setExpenseDate(LocalDate.of(2026, 10, 8));
        req.setPaymentMethod(ExpensePaymentMethod.CASH_PETTY);
        req.setDescription("Fuel for delivery truck B1234XYZ");
        req.setCreatedById(managerId);

        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
        when(employeeRepository.findById(managerId)).thenReturn(Optional.of(manager));
        when(expenseRepository.findCommittedExpenses(any(), any(), any(), any())).thenReturn(List.of());
        when(budgetRequestRepository.findByStoreIdAndExpenseCategoryIdAndPeriodMonthAndPeriodYear(
                storeId, categoryId, 10, 2026)).thenReturn(Optional.empty());
        when(numberingService.nextNumber(storeId, "EXPENSE")).thenReturn("EXP/ST01/10/2026/0001");
        when(expenseRepository.save(any(Expense.class))).thenAnswer(inv -> {
            Expense e = inv.getArgument(0);
            return withId(e, UUID.randomUUID());
        });

        ExpenseResponse resp = expenseService.createExpense(req);
        assertThat(resp.getExpenseNumber()).isEqualTo("EXP/ST01/10/2026/0001");
        assertThat(resp.isOverrun()).isFalse();
        assertThat(resp.getStatus()).isEqualTo(ExpenseStatus.APPROVED);
    }

    @Test
    void createExpense_overrunBudget_flagsOverrunAndPendingApproval() {
        // Category baseline limit is 5,000,000
        // Prior spent is 4,500,000
        // New expense is 1,000,000 -> Total 5,500,000 > 5,000,000 -> OVERRUN!
        Expense prior = new Expense();
        prior.setAmount(new BigDecimal("4500000"));

        CreateExpenseRequest req = new CreateExpenseRequest();
        req.setStoreId(storeId);
        req.setExpenseCategoryId(categoryId);
        req.setAmount(new BigDecimal("1000000"));
        req.setExpenseDate(LocalDate.of(2026, 10, 8));
        req.setPaymentMethod(ExpensePaymentMethod.CASH_PETTY);
        req.setDescription("Engine repair for delivery van");
        req.setCreatedById(managerId);

        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
        when(employeeRepository.findById(managerId)).thenReturn(Optional.of(manager));
        when(expenseRepository.findCommittedExpenses(any(), any(), any(), any())).thenReturn(List.of(prior));
        when(budgetRequestRepository.findByStoreIdAndExpenseCategoryIdAndPeriodMonthAndPeriodYear(
                storeId, categoryId, 10, 2026)).thenReturn(Optional.empty());
        when(numberingService.nextNumber(storeId, "EXPENSE")).thenReturn("EXP/ST01/10/2026/0002");
        when(expenseRepository.save(any(Expense.class))).thenAnswer(inv -> {
            Expense e = inv.getArgument(0);
            return withId(e, UUID.randomUUID());
        });

        ExpenseResponse resp = expenseService.createExpense(req);
        assertThat(resp.isOverrun()).isTrue();
        assertThat(resp.getStatus()).isEqualTo(ExpenseStatus.PENDING_APPROVAL);
    }

    @Test
    void approveAndPayExpense_lifecycle() {
        UUID expId = UUID.randomUUID();
        Expense exp = new Expense();
        ReflectionTestUtils.setField(exp, "id", expId);
        exp.setStore(store);
        exp.setExpenseCategory(category);
        exp.setStatus(ExpenseStatus.PENDING_APPROVAL);
        exp.setAmount(new BigDecimal("1200000"));

        when(expenseRepository.findById(expId)).thenReturn(Optional.of(exp));
        when(employeeRepository.findById(managerId)).thenReturn(Optional.of(manager));
        when(expenseRepository.save(any(Expense.class))).thenAnswer(inv -> inv.getArgument(0));

        ApproveExpenseRequest appReq = new ApproveExpenseRequest();
        appReq.setApprovedById(managerId);
        appReq.setApproved(true);
        appReq.setNotes("Approved overrun justified by vehicle breakdown");

        ExpenseResponse appResp = expenseService.approveExpense(expId, appReq);
        assertThat(appResp.getStatus()).isEqualTo(ExpenseStatus.APPROVED);

        ExpenseResponse paidResp = expenseService.payExpense(expId);
        assertThat(paidResp.getStatus()).isEqualTo(ExpenseStatus.PAID);
    }

    @Test
    void getBudgetConsumption_calculatesSpentAndPercent() {
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(categoryRepository.findByActiveTrue()).thenReturn(List.of(category));

        Expense prior = new Expense();
        prior.setAmount(new BigDecimal("2500000"));
        when(expenseRepository.findCommittedExpenses(any(), any(), any(), any())).thenReturn(List.of(prior));
        when(budgetRequestRepository.findByStoreIdAndExpenseCategoryIdAndPeriodMonthAndPeriodYear(
                storeId, categoryId, 10, 2026)).thenReturn(Optional.empty());

        List<BudgetConsumptionResponse> consumption = expenseService.getBudgetConsumption(storeId, 2026, 10);
        assertThat(consumption).hasSize(1);
        BudgetConsumptionResponse row = consumption.get(0);
        assertThat(row.getAllocatedBudget()).isEqualByComparingTo("5000000");
        assertThat(row.getTotalSpent()).isEqualByComparingTo("2500000");
        assertThat(row.getRemainingBudget()).isEqualByComparingTo("2500000");
        assertThat(row.isOverrun()).isFalse();
        assertThat(row.getConsumptionPercent()).isEqualTo(50.0);
    }
}
